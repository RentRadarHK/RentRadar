import { supabase } from "@/lib/supabase";
import { Building, Landlord, Review, SearchResult, StatutoryOrder } from "@/lib/data/types";

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
}

interface ReviewRow {
  id: string;
  landlord_id: string | null;
  building_id: string | null;
  created_at: string;
  rating_overall: number;
  review_text: string;
  verified_tenant: boolean;
  rating_deposit: number;
  rating_responsiveness: number;
  rating_accuracy: number;
  rating_maintenance: number;
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
  };
}

function headlineFromText(text: string): string {
  // Use first sentence, capped at 80 chars
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text;
  return firstSentence.length <= 80
    ? firstSentence
    : firstSentence.slice(0, 77).replace(/\s+\S*$/, "") + "...";
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    landlordId: row.landlord_id ?? "",
    buildingId: row.building_id ?? "",
    flatRef: "",
    rating: row.rating_overall,
    headline: headlineFromText(row.review_text),
    body: row.review_text,
    verifiedTenant: row.verified_tenant,
    district: "",
    market: "",
    datePosted: row.created_at,
    helpfulCount: 0,
    dimensions: {
      depositReturn: row.rating_deposit,
      responsiveness: row.rating_responsiveness,
      listingAccuracy: row.rating_accuracy,
      maintenance: row.rating_maintenance,
      renewalFairness: 0,
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
  return (data as ReviewRow[]).map(mapReview);
}

export async function getReviewsForLandlord(landlordId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("landlord_id", landlordId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ReviewRow[]).map(mapReview);
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

