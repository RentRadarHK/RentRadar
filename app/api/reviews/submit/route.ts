import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendVerificationEmail, sendModerationEmail } from "@/lib/email/resend";

// ── Validation ────────────────────────────────────────────────────────────────

interface SubmitBody {
  building_id?: string;
  landlord_id?: string;
  tenancy_from?: number;
  tenancy_to?: number;
  currently_renting?: boolean;
  rental_method?: "direct" | "agent" | "corporate";
  rating_overall: number;
  rating_maintenance?: number;
  rating_cleanliness?: number;
  rating_pest_control?: number;
  rating_noise?: number;
  rating_facilities?: number;
  rating_building_mgmt?: number;
  rating_deposit_return?: number;
  rating_listing_accuracy?: number;
  rating_landlord_responsiveness?: number;
  rating_flat_repairs?: number;
  rating_would_rent_again?: number;
  unit_type?: string;
  floor_number?: string;
  landlord_name?: string;
  review_text?: string;
  building_day_to_day?: string;
  building_issues?: string;
  landlord_experience?: string;
  landlord_deposit?: string;
  landlord_rent_again?: string;
  monthly_rent?: number;
  flat_size_sqft?: number;
  verification_method: "google" | "email" | "document";
  verification_email?: string;
  document_base64?: string;
  document_mime?: string;
  document_filename?: string;
}

function wc(text: string | undefined): number {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).length;
}

function validate(body: SubmitBody): string | null {
  if (!body.building_id && !body.landlord_id)
    return "building_id or landlord_id is required";
  const buildingOk = wc(body.building_day_to_day) >= 15 || wc(body.building_issues) >= 5;
  const landlordOk = wc(body.landlord_experience) >= 15 || wc(body.landlord_deposit) >= 5 || wc(body.landlord_rent_again) >= 5;
  if (!buildingOk)
    return "Please answer at least one building question (minimum word count not met)";
  if (!landlordOk)
    return "Please answer at least one landlord question (minimum word count not met)";
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
  const moderationToken = crypto.randomUUID();

  const generatedReviewText = [
    body.building_day_to_day,
    body.building_issues,
    body.landlord_experience,
    body.landlord_deposit,
    body.landlord_rent_again,
  ].filter(Boolean).join("\n\n");

  const reviewRecord = {
    building_id:           body.building_id ?? null,
    landlord_id:           body.landlord_id ?? null,
    tenancy_from:          body.tenancy_from ?? null,
    tenancy_to:            body.tenancy_to ?? null,
    currently_renting:     body.currently_renting ?? false,
    rental_method:         body.rental_method ?? null,
    unit_type:             body.unit_type ?? null,
    floor_number:          body.floor_number ?? null,
    landlord_name:         body.landlord_name ?? null,
    rating_overall:                 body.rating_overall,
    rating_maintenance:             body.rating_maintenance ?? null,
    rating_cleanliness:             body.rating_cleanliness ?? null,
    rating_pest_control:            body.rating_pest_control ?? null,
    rating_noise:                   body.rating_noise ?? null,
    rating_facilities:              body.rating_facilities ?? null,
    rating_building_mgmt:           body.rating_building_mgmt ?? null,
    rating_deposit_return:          body.rating_deposit_return ?? null,
    rating_listing_accuracy:        body.rating_listing_accuracy ?? null,
    rating_landlord_responsiveness: body.rating_landlord_responsiveness ?? null,
    rating_flat_repairs:            body.rating_flat_repairs ?? null,
    rating_would_rent_again:        body.rating_would_rent_again ?? null,
    review_text:           generatedReviewText,
    building_day_to_day:   body.building_day_to_day ?? null,
    building_issues:       body.building_issues ?? null,
    landlord_experience:   body.landlord_experience ?? null,
    landlord_deposit:      body.landlord_deposit ?? null,
    landlord_rent_again:   body.landlord_rent_again ?? null,
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
    moderation_token:      moderationToken,
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
  console.log("verification_method:", body.verification_method);
  if (body.verification_method === "email" && body.verification_email) {
    console.log("attempting to send verification email to:", body.verification_email);

    const { data: tokenRow, error: tokenError } = await supabase
      .from("review_verification_tokens")
      .insert({ review_id: reviewId })
      .select("token")
      .single();

    if (tokenError || !tokenRow) {
      console.error("Token insert failed:", tokenError?.message, tokenError?.code, tokenError?.details);
    } else {
      console.log("token inserted:", tokenRow.token);
      try {
        await sendVerificationEmail(body.verification_email, reviewId, tokenRow.token);
        console.log("email sent successfully");
      } catch (emailErr) {
        console.error("email send failed:", emailErr);
      }
    }
  }

  // ── Admin moderation email ────────────────────────────────────────────────
  try {
    // Fetch the property name for the email subject/heading
    let propertyName = "Unknown property";
    let propertyType: "building" | "landlord" = "building";

    if (body.building_id) {
      const { data: bldg } = await supabase
        .from("buildings")
        .select("name")
        .eq("id", body.building_id)
        .single();
      if (bldg) { propertyName = bldg.name; propertyType = "building"; }
    } else if (body.landlord_id) {
      const { data: ll } = await supabase
        .from("landlords")
        .select("name")
        .eq("id", body.landlord_id)
        .single();
      if (ll) { propertyName = ll.name; propertyType = "landlord"; }
    }

    await sendModerationEmail({
      reviewId,
      moderationToken,
      propertyName,
      propertyType,
      reviewText:                     generatedReviewText,
      landlordName:                   body.landlord_name,
      buildingDayToDay:               body.building_day_to_day,
      buildingIssues:                 body.building_issues,
      landlordExperience:             body.landlord_experience,
      landlordDeposit:                body.landlord_deposit,
      landlordRentAgain:              body.landlord_rent_again,
      ratingOverall:                  body.rating_overall,
      ratingMaintenance:              body.rating_maintenance,
      ratingCleanliness:              body.rating_cleanliness,
      ratingPestControl:              body.rating_pest_control,
      ratingNoise:                    body.rating_noise,
      ratingFacilities:               body.rating_facilities,
      ratingBuildingMgmt:             body.rating_building_mgmt,
      ratingDepositReturn:            body.rating_deposit_return,
      ratingListingAccuracy:          body.rating_listing_accuracy,
      ratingLandlordResponsiveness:   body.rating_landlord_responsiveness,
      ratingFlatRepairs:              body.rating_flat_repairs,
      ratingWouldRentAgain:           body.rating_would_rent_again,
      tenancyFrom:                    body.tenancy_from,
      tenancyTo:                      body.tenancy_to,
      currentlyRenting:               body.currently_renting,
      monthlyRent:                    body.monthly_rent,
      verifiedTenant:                 body.verification_method === "google",
      verificationMethod:             body.verification_method,
      reviewerEmail:                  user?.email ?? body.verification_email,
    });
  } catch (modErr) {
    // Non-fatal — review is saved regardless
    console.error("Moderation email failed:", modErr);
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
