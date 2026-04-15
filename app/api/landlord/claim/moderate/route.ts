import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendClaimApprovalEmail, sendClaimRejectionEmail } from "@/lib/email/resend";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const id     = searchParams.get("id");
  const token  = searchParams.get("token");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentradar.co";

  if (!action || !id || !token || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const supabase = serviceClient();

  // Fetch claim and verify token
  const { data: claim, error } = await supabase
    .from("landlord_claims")
    .select("*")
    .eq("id", id)
    .eq("moderation_token", token)
    .single();

  if (error || !claim) {
    return NextResponse.json({ error: "Claim not found or invalid token" }, { status: 404 });
  }

  if (claim.status !== "pending") {
    return NextResponse.redirect(`${siteUrl}/admin/claim-${claim.status === "approved" ? "approved" : "rejected"}`);
  }

  if (action === "approve") {
    // Update claim
    await supabase
      .from("landlord_claims")
      .update({ status: "approved" })
      .eq("id", id);

    // Update landlord
    await supabase
      .from("landlords")
      .update({
        claimed:        true,
        claim_status:   "approved",
        claimed_at:     new Date().toISOString(),
        claim_user_id:  claim.user_id,
        verified:       true,
      })
      .eq("id", claim.landlord_id);

    // Send approval email to claimant
    try {
      const { data: landlord } = await supabase
        .from("landlords")
        .select("name")
        .eq("id", claim.landlord_id)
        .single();
      await sendClaimApprovalEmail(claim.contact_email, landlord?.name ?? "your profile");
    } catch (err) {
      console.error("Claim approval email failed:", err);
    }

    return NextResponse.redirect(`${siteUrl}/admin/claim-approved`);
  }

  // Reject
  await supabase
    .from("landlord_claims")
    .update({ status: "rejected" })
    .eq("id", id);

  await supabase
    .from("landlords")
    .update({ claim_status: "unclaimed" })
    .eq("id", claim.landlord_id);

  try {
    const { data: landlord } = await supabase
      .from("landlords")
      .select("name")
      .eq("id", claim.landlord_id)
      .single();
    await sendClaimRejectionEmail(claim.contact_email, landlord?.name ?? "your profile");
  } catch (err) {
    console.error("Claim rejection email failed:", err);
  }

  return NextResponse.redirect(`${siteUrl}/admin/claim-rejected`);
}
