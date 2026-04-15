import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

  const { data: response, error } = await supabase
    .from("review_responses")
    .select("id, status")
    .eq("id", id)
    .eq("moderation_token", token)
    .single();

  if (error || !response) {
    return NextResponse.json({ error: "Response not found or invalid token" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  await supabase
    .from("review_responses")
    .update({ status: newStatus })
    .eq("id", id);

  const label = action === "approve" ? "approved" : "rejected";
  return NextResponse.redirect(`${siteUrl}/admin/moderated?type=response&status=${label}`);
}
