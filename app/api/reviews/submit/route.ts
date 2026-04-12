import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendVerificationEmail } from "@/lib/email/resend";

// ── Validation ────────────────────────────────────────────────────────────────

interface SubmitBody {
  building_id?: string;
  landlord_id?: string;
  tenancy_from?: number;
  tenancy_to?: number;
  currently_renting?: boolean;
  rental_method?: "direct" | "agent" | "corporate";
  rating_overall: number;
  rating_deposit: number;
  rating_accuracy: number;
  rating_maintenance: number;
  rating_responsiveness: number;
  review_text: string;
  monthly_rent?: number;
  flat_size_sqft?: number;
  verification_method: "google" | "email" | "document";
  verification_email?: string;
  document_base64?: string;
  document_mime?: string;
  document_filename?: string;
}

function validate(body: SubmitBody): string | null {
  if (!body.building_id && !body.landlord_id)
    return "building_id or landlord_id is required";
  if (!body.review_text || body.review_text.trim().split(/\s+/).length < 50)
    return "Review must be at least 50 words";
  if (!body.rating_overall || body.rating_overall < 1 || body.rating_overall > 5)
    return "rating_overall must be 1–5";
  if (!["google", "email", "document"].includes(body.verification_method))
    return "Invalid verification_method";
  if (body.verification_method === "email" && !body.verification_email)
    return "verification_email is required for email verification";
  return null;
}

// ── Service-role client (bypasses RLS) ───────────────────────────────────────

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase service role config");
  return createServiceClient(url, key);
}

// ── POST /api/reviews/submit ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // ── Auth check ────────────────────────────────────────────────────────────
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (body.verification_method === "google" && !user) {
    return NextResponse.json(
      { error: "You must be signed in with Google to use this verification method" },
      { status: 401 }
    );
  }

  const supabase = serviceClient();

  // ── Document upload ───────────────────────────────────────────────────────
  let documentUrl: string | null = null;

  if (body.verification_method === "document" && body.document_base64) {
    const userId = user?.id ?? "anon";
    const tempReviewId = crypto.randomUUID();
    const filename = body.document_filename ?? "document";
    const path = `${userId}/${tempReviewId}/${filename}`;

    const buffer = Buffer.from(body.document_base64, "base64");
    const { error: uploadError } = await supabase.storage
      .from("review-documents")
      .upload(path, buffer, {
        contentType: body.document_mime ?? "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Document upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Store the storage path (not a public URL — private bucket)
    documentUrl = path;
  }

  // ── Insert review ─────────────────────────────────────────────────────────
  const reviewRecord = {
    building_id:           body.building_id ?? null,
    landlord_id:           body.landlord_id ?? null,
    tenancy_from:          body.tenancy_from ?? null,
    tenancy_to:            body.tenancy_to ?? null,
    currently_renting:     body.currently_renting ?? false,
    rental_method:         body.rental_method ?? null,
    rating_overall:        body.rating_overall,
    rating_deposit:        body.rating_deposit,
    rating_accuracy:       body.rating_accuracy,
    rating_maintenance:    body.rating_maintenance,
    rating_responsiveness: body.rating_responsiveness,
    review_text:           body.review_text,
    monthly_rent:          body.monthly_rent ?? null,
    flat_size_sqft:        body.flat_size_sqft ?? null,
    verification_method:   body.verification_method,
    verification_email:    body.verification_email ?? null,
    document_url:          documentUrl,
    reviewer_user_id:      user?.id ?? null,
    reviewer_email:        user?.email ?? body.verification_email ?? null,
    reviewer_ip:           req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
    // Google auth = immediately verified; others start pending
    verified_tenant:       body.verification_method === "google",
    status:                "pending" as const,
  };

  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert(reviewRecord)
    .select("id")
    .single();

  if (insertError || !review) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save review" },
      { status: 500 }
    );
  }

  const reviewId: string = review.id;

  // ── Email verification token ──────────────────────────────────────────────
  if (body.verification_method === "email" && body.verification_email) {
    const { data: tokenRow, error: tokenError } = await supabase
      .from("review_verification_tokens")
      .insert({ review_id: reviewId })
      .select("token")
      .single();

    if (tokenError || !tokenRow) {
      // Non-fatal — review saved but email won't send
      console.error("Token insert failed:", tokenError?.message);
    } else {
      try {
        await sendVerificationEmail(body.verification_email, reviewId, tokenRow.token);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // Non-fatal — review saved; user can re-request later
      }
    }
  }

  // ── Rating aggregation ────────────────────────────────────────────────────
  // Only updates ratings when the review moves to "approved" via moderation,
  // so calling it now is a no-op unless the review is immediately approved.
  // We call it defensively to support auto-approve setups.
  if (body.building_id) {
    await supabase.rpc("update_entity_rating", {
      entity_type: "building",
      entity_id: body.building_id,
    });
  }
  if (body.landlord_id) {
    await supabase.rpc("update_entity_rating", {
      entity_type: "landlord",
      entity_id: body.landlord_id,
    });
  }

  return NextResponse.json({ success: true, reviewId });
}
