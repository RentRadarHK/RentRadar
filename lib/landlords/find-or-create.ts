import type { SupabaseClient } from "@supabase/supabase-js";

export function slugifyLandlordName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return slug || "landlord";
}

async function generateUniqueLandlordId(
  supabase: SupabaseClient,
  name: string
): Promise<string> {
  const base = slugifyLandlordName(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("landlords")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();

    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function linkLandlordToBuilding(
  supabase: SupabaseClient,
  buildingId: string,
  landlordId: string
) {
  const { data: existing } = await supabase
    .from("building_landlords")
    .select("id")
    .eq("building_id", buildingId)
    .eq("landlord_id", landlordId)
    .maybeSingle();

  if (existing) return;

  await supabase.from("building_landlords").insert({
    building_id: buildingId,
    landlord_id: landlordId,
  });
}

/**
 * Find an existing landlord profile by name, or create an unclaimed stub profile
 * that is immediately searchable and claimable.
 */
export async function findOrCreateLandlordProfile(
  supabase: SupabaseClient,
  name: string,
  options?: { buildingId?: string | null }
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Landlord name is required");
  }

  const { data: existing } = await supabase
    .from("landlords")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  let landlordId = existing?.id as string | undefined;

  if (!landlordId) {
    landlordId = await generateUniqueLandlordId(supabase, trimmed);

    const { error } = await supabase.from("landlords").insert({
      id: landlordId,
      name: trimmed,
      company: "",
      verified: false,
      claim_status: "unclaimed",
      active_markets: ["Hong Kong"],
      total_properties: 0,
    });

    if (error) {
      throw new Error(`Failed to create landlord profile: ${error.message}`);
    }
  }

  if (options?.buildingId) {
    await linkLandlordToBuilding(supabase, options.buildingId, landlordId);
  }

  return landlordId;
}
