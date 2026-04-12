import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

// GET /api/reviews/verify?token=xxx
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentradar.co";

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/review/expired`);
  }

  const supabase = serviceClient();

  // Look up the token
  const { data: tokenRow, error } = await supabase
    .from("review_verification_tokens")
    .select("id, review_id, expires_at, used")
    .eq("token", token)
    .single();

  if (error || !tokenRow) {
    return NextResponse.redirect(`${siteUrl}/review/expired`);
  }

  // Check used or expired
  if (tokenRow.used || new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.redirect(`${siteUrl}/review/expired`);
  }

  // Mark token used and review verified
  const [{ error: tokenUpdateError }, { error: reviewUpdateError }] = await Promise.all([
    supabase
      .from("review_verification_tokens")
      .update({ used: true })
      .eq("id", tokenRow.id),
    supabase
      .from("reviews")
      .update({ verified_tenant: true })
      .eq("id", tokenRow.review_id),
  ]);

  if (tokenUpdateError || reviewUpdateError) {
    console.error("Verify update failed:", tokenUpdateError ?? reviewUpdateError);
    return NextResponse.redirect(`${siteUrl}/review/expired`);
  }

  return NextResponse.redirect(`${siteUrl}/review/verified`);
}
