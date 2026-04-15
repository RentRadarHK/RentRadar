import { supabase } from "@/lib/supabase";
import { Building, Landlord, Review, ReviewResponse, SearchResult, StatutoryOrder } from "@/lib/data/types";

// ── Raw DB row shapes ─────────────────────────────────────────────────────────

interface StatutoryOrderRow {
  id: string;
  building_id: string;
  type: string;
  issued_date: string;
  status: string;
  section: string;
  description: string;
}

interface BuildingRow {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  market: string;
  building_type: string;
  floors: number;
  units: number;
  occupation_permit_date: string;
  occupation_permit_number: string;
  block_id: string;
  avg_rating: number;
  total_reviews: number;
  gov_data_last_updated: string;
  statutory_orders?: StatutoryOrderRow[];
  building_landlords?: { landlord_id: string }[];
}

interface LandlordRow {
  id: string;
  name: string;
  company: string;
  verified: boolean;
  verified_date: string | null;
  active_since: string;
  active_markets: string[];
  total_properties: number;
  avg_rating: number;
  total_reviews: number;
  rating_deposit_return: number;
  rating_responsiveness: number;
  rating_listing_accuracy: number;
  rating_maintenance: number;
  rating_renewal_fairness: number;
  claim_status: string | null;
  claim_user_id: string | null;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
}

interface ReviewResponseRow {
  id: string;
  created_at: string;
  review_id: string;
  landlord_id: string;
  response_text: string;
  status: string;
  moderation_token: string;
}

interface ReviewRow {
  id: string;
  landlord_id: string | null;
  building_id: string | null;
  created_at: string;
  rating_overall: number;
  review_text: string;
  verified_tenant: boolean;
  // Building ratings
  rating_maintenance: number | null;
  rating_cleanliness: number | null;
  rating_pest_control: number | null;
  rating_noise: number | null;
  rating_facilities: number | null;
  rating_building_mgmt: number | null;
  // Landlord ratings
  rating_deposit_return: number | null;
  rating_listing_accuracy: number | null;
  rating_landlord_responsiveness: number | null;
  rating_flat_repairs: number | null;
  rating_would_rent_again: number | null;
  // Unit info
  unit_type: string | null;
  floor_number: string | null;
  unit_number: string | null;
  // Guided review fields
  building_day_to_day: string | null;
  building_issues: string | null;
  landlord_experience: string | null;
  landlord_deposit: string | null;
  landlord_rent_again: string | null;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function mapStatutoryOrder(row: StatutoryOrderRow): StatutoryOrder {
  return {
    id: row.id,
    type: row.type as StatutoryOrder["type"],
    issuedDate: row.issued_date,
    status: row.status as StatutoryOrder["status"],
    section: row.section,
    description: row.description,
  };
}

function mapBuilding(row: BuildingRow): Building {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    district: row.district,
    region: row.region as Building["region"],
    market: row.market,
    buildingType: row.building_type,
    floors: row.floors,
    units: row.units,
    occupationPermitDate: row.occupation_permit_date,
    occupationPermitNumber: row.occupation_permit_number,
    blockId: row.block_id,
    govDataLastUpdated: row.gov_data_last_updated,
    statutoryOrders: (row.statutory_orders ?? []).map(mapStatutoryOrder),
    landlords: (row.building_landlords ?? []).map((bl) => bl.landlord_id),
    avgRating: Number(row.avg_rating),
    totalReviews: row.total_reviews,
  };
}

function mapLandlord(row: LandlordRow, propertyIds: string[] = []): Landlord {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    verified: row.verified,
    verifiedDate: row.verified_date ?? undefined,
    activeMarkets: row.active_markets ?? [],
    activeSince: row.active_since,
    totalProperties: row.total_properties,
    properties: propertyIds,
    avgRating: Number(row.avg_rating),
    totalReviews: row.total_reviews,
    ratings: {
      depositReturn: Number(row.rating_deposit_return),
      responsiveness: Number(row.rating_responsiveness),
      listingAccuracy: Number(row.rating_listing_accuracy),
      maintenance: Number(row.rating_maintenance),
      renewalFairness: Number(row.rating_renewal_fairness),
    },
    redFlags: [], // derived from reviews in the component
    claimStatus: row.claim_status ?? "unclaimed",
    claimUserId: row.claim_user_id ?? undefined,
    bio: row.bio ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    website: row.website ?? undefined,
  };
}

function mapReviewResponse(row: ReviewResponseRow): ReviewResponse {
  return {
    id: row.id,
    reviewId: row.review_id,
    landlordId: row.landlord_id,
    responseText: row.response_text,
    status: row.status,
    createdAt: row.created_at,
    moderationToken: row.moderation_token,
  };
}

async function attachResponses(reviews: Review[]): Promise<Review[]> {
  if (reviews.length === 0) return reviews;
  const ids = reviews.map((r) => r.id);
  const { data } = await supabase
    .from("review_responses")
    .select("*")
    .in("review_id", ids)
    .eq("status", "approved");
  if (!data || data.length === 0) return reviews;
  const byReview = new Map(
    (data as ReviewResponseRow[]).map((r) => [r.review_id, mapReviewResponse(r)])
  );
  return reviews.map((review) => ({
    ...review,
    response: byReview.get(review.id),
  }));
}

function headlineFromText(text: string): string {
  // Use first sentence, capped at 80 chars
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text;
  return firstSentence.length <= 80
    ? firstSentence
    : firstSentence.slice(0, 77).replace(/\s+\S*$/, "") + "...";
}

function mapReview(row: ReviewRow): Review {
  const firstAnswer =
    row.building_day_to_day ||
    row.landlord_experience ||
    row.review_text;
  return {
    id: row.id,
    landlordId: row.landlord_id ?? "",
    buildingId: row.building_id ?? "",
    flatRef: "",
    rating: row.rating_overall,
    headline: headlineFromText(firstAnswer),
    body: row.review_text,
    verifiedTenant: row.verified_tenant,
    unitType: row.unit_type ?? undefined,
    floorNumber: row.floor_number ?? undefined,
    unitNumber: row.unit_number ?? undefined,
    buildingDayToDay: row.building_day_to_day ?? undefined,
    buildingIssues: row.building_issues ?? undefined,
    landlordExperience: row.landlord_experience ?? undefined,
    landlordDeposit: row.landlord_deposit ?? undefined,
    landlordRentAgain: row.landlord_rent_again ?? undefined,
    district: "",
    market: "",
    datePosted: row.created_at,
    helpfulCount: 0,
    dimensions: {
      maintenance:              row.rating_maintenance ?? 0,
      cleanliness:              row.rating_cleanliness ?? 0,
      pestControl:              row.rating_pest_control ?? 0,
      noise:                    row.rating_noise ?? 0,
      facilities:               row.rating_facilities ?? 0,
      buildingMgmt:             row.rating_building_mgmt ?? 0,
      depositReturn:            row.rating_deposit_return ?? 0,
      listingAccuracy:          row.rating_listing_accuracy ?? 0,
      landlordResponsiveness:   row.rating_landlord_responsiveness ?? 0,
      flatRepairs:              row.rating_flat_repairs ?? 0,
      wouldRentAgain:           row.rating_would_rent_again ?? 0,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBuildingSearchResult(b: Building): SearchResult {
  const hasOrders = b.statutoryOrders.some((o) => o.status === "Outstanding");
  return {
    type: "building",
    id: b.id,
    name: b.name,
    address: b.address,
    district: b.district,
    market: b.market,
    rating: b.avgRating,
    reviewCount: b.totalReviews,
    badge: hasOrders ? "Orders on Record" : b.avgRating >= 4.2 ? "Top Rated" : undefined,
    govDataAvailable: true,
  };
}

function toLandlordSearchResult(l: Landlord): SearchResult {
  return {
    type: "landlord",
    id: l.id,
    name: l.name,
    address: undefined,
    district: l.activeMarkets[0] ?? "Hong Kong",
    market: l.activeMarkets[0] ?? "Hong Kong",
    rating: l.avgRating,
    reviewCount: l.totalReviews,
    badge: l.verified ? "Verified" : undefined,
    govDataAvailable: false,
  };
}

// ── Public query functions ────────────────────────────────────────────────────

export async function getBuilding(id: string): Promise<Building | null> {
  const { data, error } = await supabase
    .from("buildings")
    .select("*, statutory_orders(*), building_landlords(landlord_id)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapBuilding(data as BuildingRow);
}

export async function getBuildings(): Promise<Building[]> {
  const { data, error } = await supabase
    .from("buildings")
    .select("*, statutory_orders(*), building_landlords(landlord_id)")
    .order("name");

  if (error || !data) return [];
  return (data as BuildingRow[]).map(mapBuilding);
}

export async function getLandlord(id: string): Promise<Landlord | null> {
  const [{ data: lRow, error }, { data: blRows }] = await Promise.all([
    supabase.from("landlords").select("*").eq("id", id).single(),
    supabase.from("building_landlords").select("building_id").eq("landlord_id", id),
  ]);

  if (error || !lRow) return null;
  const propertyIds = (blRows ?? []).map((r: { building_id: string }) => r.building_id);
  return mapLandlord(lRow as LandlordRow, propertyIds);
}

export async function getLandlords(): Promise<Landlord[]> {
  const { data, error } = await supabase.from("landlords").select("*").order("name");
  if (error || !data) return [];
  return (data as LandlordRow[]).map((row) => mapLandlord(row));
}

export async function getReviewsForBuilding(buildingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("building_id", buildingId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return attachResponses((data as ReviewRow[]).map(mapReview));
}

export async function getReviewsForLandlord(landlordId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("landlord_id", landlordId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return attachResponses((data as ReviewRow[]).map(mapReview));
}

export async function getLandlordByUserId(userId: string): Promise<Landlord | null> {
  const { data, error } = await supabase
    .from("landlords")
    .select("*")
    .eq("claim_user_id", userId)
    .eq("claim_status", "approved")
    .single();

  if (error || !data) return null;
  return mapLandlord(data as LandlordRow);
}

export async function checkUserIsLandlord(
  userId: string
): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase
    .from("landlords")
    .select("id, name")
    .eq("claim_user_id", userId)
    .eq("claim_status", "approved")
    .single();
  return data ?? null;
}

export async function getLandlordsForBuilding(buildingId: string): Promise<Landlord[]> {
  const { data, error } = await supabase
    .from("building_landlords")
    .select("landlord_id")
    .eq("building_id", buildingId);

  if (error || !data || data.length === 0) return [];

  const ids = (data as { landlord_id: string }[]).map((r) => r.landlord_id);
  const { data: rows, error: err2 } = await supabase
    .from("landlords")
    .select("*")
    .in("id", ids);

  if (err2 || !rows) return [];
  return (rows as LandlordRow[]).map((row) => mapLandlord(row));
}

export async function getBuildingsForLandlord(landlordId: string): Promise<Building[]> {
  const { data, error } = await supabase
    .from("building_landlords")
    .select("building_id")
    .eq("landlord_id", landlordId);

  if (error || !data || data.length === 0) return [];

  const ids = (data as { building_id: string }[]).map((r) => r.building_id);
  const { data: rows, error: err2 } = await supabase
    .from("buildings")
    .select("*, statutory_orders(*), building_landlords(landlord_id)")
    .in("id", ids);

  if (err2 || !rows) return [];
  return (rows as BuildingRow[]).map(mapBuilding);
}

/** Returns the live total counts of buildings and landlords. */
export async function getCounts(): Promise<{ buildings: number; landlords: number }> {
  const [{ count: bCount }, { count: lCount }] = await Promise.all([
    supabase.from("buildings").select("*", { count: "exact", head: true }),
    supabase.from("landlords").select("*", { count: "exact", head: true }),
  ]);
  return { buildings: bCount ?? 0, landlords: lCount ?? 0 };
}

export async function searchAll(
  query: string
): Promise<{ buildings: SearchResult[]; landlords: SearchResult[] }> {
  // Empty query → return a capped browse (1,000 buildings, all landlords)
  if (!query || query.trim().length < 2) {
    const [{ data: bldgRows }, lords] = await Promise.all([
      supabase
        .from("buildings")
        .select("id,name,address,district,market,avg_rating,total_reviews,statutory_orders(status)")
        .order("name")
        .limit(1000),
      getLandlords(),
    ]);
    type BrowseRow = { id: string; name: string; address: string; district: string; market: string; avg_rating: number; total_reviews: number; statutory_orders: { status: string }[] };
    const buildings: SearchResult[] = (bldgRows ?? []).map(
      (b: BrowseRow) => ({
        type: "building" as const,
        id: b.id,
        name: b.name,
        address: b.address,
        district: b.district,
        market: b.market,
        rating: Number(b.avg_rating),
        reviewCount: b.total_reviews,
        badge: (b.statutory_orders ?? []).some((o) => o.status === "Outstanding")
          ? "Orders on Record"
          : Number(b.avg_rating) >= 4.2
          ? "Top Rated"
          : undefined,
        govDataAvailable: true,
      })
    );
    return { buildings, landlords: lords.map(toLandlordSearchResult) };
  }

  // Split query into words (min 2 chars each) for forgiving word-by-word matching
  const words = query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    const [bldgs, lords] = await Promise.all([getBuildings(), getLandlords()]);
    return {
      buildings: bldgs.map(toBuildingSearchResult),
      landlords: lords.map(toLandlordSearchResult),
    };
  }

  const buildingOrFilter = words
    .flatMap((w) => [`name.ilike.%${w}%`, `address.ilike.%${w}%`, `district.ilike.%${w}%`])
    .join(",");

  const landlordOrFilter = words
    .flatMap((w) => [`name.ilike.%${w}%`, `company.ilike.%${w}%`])
    .join(",");

  const [{ data: bldgRows }, { data: lordRows }] = await Promise.all([
    supabase
      .from("buildings")
      .select("*, statutory_orders(status)")
      .or(buildingOrFilter),
    supabase
      .from("landlords")
      .select("*")
      .or(landlordOrFilter),
  ]);

  const buildings: SearchResult[] = (bldgRows ?? []).map(
    (b: BuildingRow & { statutory_orders: { status: string }[] }) => ({
      type: "building" as const,
      id: b.id,
      name: b.name,
      address: b.address,
      district: b.district,
      market: b.market,
      rating: Number(b.avg_rating),
      reviewCount: b.total_reviews,
      badge: (b.statutory_orders ?? []).some((o) => o.status === "Outstanding")
        ? "Orders on Record"
        : Number(b.avg_rating) >= 4.2
        ? "Top Rated"
        : undefined,
      govDataAvailable: true,
    })
  );

  const landlords: SearchResult[] = (lordRows ?? []).map((l: LandlordRow) => ({
    type: "landlord" as const,
    id: l.id,
    name: l.name,
    address: undefined,
    district: (l.active_markets ?? [])[0] ?? "Hong Kong",
    market: (l.active_markets ?? [])[0] ?? "Hong Kong",
    rating: Number(l.avg_rating),
    reviewCount: l.total_reviews,
    badge: l.verified ? "Verified" : undefined,
    govDataAvailable: false,
  }));

  return { buildings, landlords };
}

