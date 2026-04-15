import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  sendClaimModerationEmail,
} from "@/lib/email/resend";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase service role config");
  return createServiceClient(url, key);
}

interface SubmitBody {
  landlordId: string;
  fullName: string;
  companyName?: string;
  contactEmail: string;
  contactPhone?: string;
  documentBase64?: string;
  documentMime?: string;
  documentFilename?: string;
  documentType?: string;
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.landlordId || !body.fullName || !body.contactEmail) {
    return NextResponse.json({ error: "landlordId, fullName, and contactEmail are required" }, { status: 400 });
  }

  const supabase = serviceClient();

  // Verify the landlord exists and isn't already claimed/pending
  const { data: landlord, error: landlordError } = await supabase
    .from("landlords")
    .select("id, name, claim_status")
    .eq("id", body.landlordId)
    .single();

  if (landlordError || !landlord) {
    return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
  }

  if (landlord.claim_status === "approved") {
    return NextResponse.json({ error: "This profile has already been claimed" }, { status: 409 });
  }

  if (landlord.claim_status === "pending") {
    return NextResponse.json({ error: "A claim is already pending for this profile" }, { status: 409 });
  }

  // Get authenticated user (optional — can claim without being logged in)
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();

  // Upload document if provided
  let documentUrl: string | null = null;
  if (body.documentBase64 && body.documentFilename) {
    const userId = user?.id ?? "anon";
    const claimId = crypto.randomUUID();
    const path = `${userId}/${claimId}/${body.documentFilename}`;
    const buffer = Buffer.from(body.documentBase64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("landlord-documents")
      .upload(path, buffer, {
        contentType: body.documentMime ?? "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Document upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }
    documentUrl = path;
  }

  // Insert claim
  const moderationToken = crypto.randomUUID();

  const { data: claim, error: claimError } = await supabase
    .from("landlord_claims")
    .insert({
      landlord_id:    body.landlordId,
      user_id:        user?.id ?? null,
      full_name:      body.fullName,
      company_name:   body.companyName ?? null,
      contact_email:  body.contactEmail,
      contact_phone:  body.contactPhone ?? null,
      document_url:   documentUrl,
      document_type:  body.documentType ?? null,
      status:         "pending",
      moderation_token: moderationToken,
    })
    .select("id")
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: claimError?.message ?? "Failed to submit claim" }, { status: 500 });
  }

  // Update landlord claim_status to pending
  await supabase
    .from("landlords")
    .update({ claim_status: "pending" })
    .eq("id", body.landlordId);

  // Send moderation email
  try {
    await sendClaimModerationEmail({
      claimId:        claim.id,
      moderationToken,
      landlordId:     body.landlordId,
      landlordName:   landlord.name,
      claimantName:   body.fullName,
      claimantEmail:  body.contactEmail,
      companyName:    body.companyName,
      documentType:   body.documentType,
    });
  } catch (err) {
    console.error("Claim moderation email failed:", err);
  }

  return NextResponse.json({ success: true, claimId: claim.id });
}
