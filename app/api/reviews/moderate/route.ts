import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

// GET /api/reviews/moderate?action=approve|reject&id=<reviewId>&token=<moderationToken>
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentradar.co";
  const { searchParams } = req.nextUrl;

  const action = searchParams.get("action");
  const id     = searchParams.get("id");
  const token  = searchParams.get("token");

  if (!action || !id || !token) {
    return NextResponse.redirect(`${siteUrl}/`);
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.redirect(`${siteUrl}/`);
  }

  const supabase = serviceClient();

  // Look up the review
  const { data: review, error } = await supabase
    .from("reviews")
    .select("id, moderation_token, building_id, landlord_id, status")
    .eq("id", id)
    .single();

  if (error || !review) {
    return NextResponse.redirect(`${siteUrl}/`);
  }

  // Verify token
  if (review.moderation_token !== token) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Already moderated — idempotent redirect
  if (review.status === "approved" || review.status === "rejected") {
    const dest = new URL(`${siteUrl}/admin/moderated`);
    dest.searchParams.set("action", review.status);
    return NextResponse.redirect(dest.toString());
  }

  // Apply action
  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("reviews")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    console.error("Moderation update failed:", updateError.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  // Recalculate ratings when approved
  if (action === "approve") {
    if (review.building_id) {
      await supabase.rpc("update_entity_rating", {
        entity_type: "building",
        entity_id: review.building_id,
      });
    }
    if (review.landlord_id) {
      await supabase.rpc("update_entity_rating", {
        entity_type: "landlord",
        entity_id: review.landlord_id,
      });
    }
  }

  // Redirect to confirmation page
  const dest = new URL(`${siteUrl}/admin/moderated`);
  dest.searchParams.set("action", action);

  if (action === "approve") {
    // Fetch property name for confirmation message
    if (review.building_id) {
      const { data: bldg } = await supabase
        .from("buildings")
        .select("name")
        .eq("id", review.building_id)
        .single();
      if (bldg?.name) dest.searchParams.set("property", bldg.name);
    } else if (review.landlord_id) {
      const { data: ll } = await supabase
        .from("landlords")
        .select("name")
        .eq("id", review.landlord_id)
        .single();
      if (ll?.name) dest.searchParams.set("property", ll.name);
    }
  }

  return NextResponse.redirect(dest.toString());
}
