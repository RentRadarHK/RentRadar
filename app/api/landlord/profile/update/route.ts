import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

interface UpdateBody {
  landlordId: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.landlordId) {
    return NextResponse.json({ error: "landlordId is required" }, { status: 400 });
  }
  if (body.bio && body.bio.length > 500) {
    return NextResponse.json({ error: "Bio must be 500 characters or fewer" }, { status: 400 });
  }

  // Verify the authenticated user owns this landlord profile
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();

  const { data: landlord } = await supabase
    .from("landlords")
    .select("claim_user_id, claim_status")
    .eq("id", body.landlordId)
    .single();

  if (!landlord || landlord.claim_user_id !== user.id || landlord.claim_status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("landlords")
    .update({
      bio:           body.bio ?? null,
      contact_email: body.contactEmail ?? null,
      contact_phone: body.contactPhone ?? null,
      website:       body.website ?? null,
    })
    .eq("id", body.landlordId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
