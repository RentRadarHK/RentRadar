import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendResponseModerationEmail } from "@/lib/email/resend";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

interface SubmitBody {
  reviewId: string;
  landlordId: string;
  responseText: string;
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.reviewId || !body.landlordId || !body.responseText?.trim()) {
    return NextResponse.json({ error: "reviewId, landlordId, and responseText are required" }, { status: 400 });
  }
  if (body.responseText.trim().length > 500) {
    return NextResponse.json({ error: "Response must be 500 characters or fewer" }, { status: 400 });
  }

  // Verify auth
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();

  // Verify the user owns this landlord profile
  const { data: landlord } = await supabase
    .from("landlords")
    .select("id, name, claim_user_id, claim_status")
    .eq("id", body.landlordId)
    .single();

  if (!landlord || landlord.claim_user_id !== user.id || landlord.claim_status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check no active response already exists
  const { data: existing } = await supabase
    .from("review_responses")
    .select("id, status")
    .eq("review_id", body.reviewId)
    .eq("landlord_id", body.landlordId)
    .in("status", ["pending", "approved"])
    .single();

  if (existing) {
    return NextResponse.json(
      { error: existing.status === "approved" ? "A response already exists for this review" : "A response is already pending for this review" },
      { status: 409 }
    );
  }

  // Fetch review excerpt for moderation email
  const { data: review } = await supabase
    .from("reviews")
    .select("review_text, building_day_to_day, landlord_experience")
    .eq("id", body.reviewId)
    .single();

  const reviewExcerpt = (
    review?.building_day_to_day ||
    review?.landlord_experience ||
    review?.review_text ||
    ""
  ).slice(0, 300);

  const moderationToken = crypto.randomUUID();

  const { data: response, error: insertError } = await supabase
    .from("review_responses")
    .insert({
      review_id:        body.reviewId,
      landlord_id:      body.landlordId,
      response_text:    body.responseText.trim(),
      status:           "pending",
      moderation_token: moderationToken,
    })
    .select("id")
    .single();

  if (insertError || !response) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to submit response" }, { status: 500 });
  }

  // Send moderation email
  try {
    await sendResponseModerationEmail({
      responseId:      response.id,
      moderationToken,
      landlordName:    landlord.name,
      reviewId:        body.reviewId,
      reviewExcerpt,
      responseText:    body.responseText.trim(),
    });
  } catch (err) {
    console.error("Response moderation email failed:", err);
  }

  return NextResponse.json({ success: true, responseId: response.id });
}
