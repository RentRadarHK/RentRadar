// DEPRECATED — do not use, all search via Supabase (lib/supabase/queries.ts searchAll)
import { SearchResult } from "./types";
import { buildings } from "./buildings";
import { landlords } from "./landlords";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Normalise: lowercase, strip punctuation, collapse whitespace
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Split a query into individual words (min 2 chars each)
function queryWords(query: string): string[] {
  return norm(query)
    .split(" ")
    .filter((w) => w.length >= 2);
}

// Score a result — any word hit counts; exact phrase hits score higher
function matchScore(query: string, ...fields: string[]): number {
  const words = queryWords(query);
  if (words.length === 0) return 0;

  // Also try the full normalised query for phrase-level scoring
  const fullQ = norm(query);
  let score = 0;

  for (const field of fields) {
    const f = norm(field);
    // Full-phrase bonus
    if (f === fullQ) score += 20;
    else if (f.includes(fullQ)) score += 10;

    // Per-word scoring
    for (const w of words) {
      if (f === w) score += 8;
      else if (f.startsWith(w)) score += 5;
      else if (f.includes(w)) score += 3;
    }
  }
  return score;
}

// Heuristic: query looks like an address if it contains digits or
// common Hong Kong street-name keywords
function looksLikeAddress(query: string): boolean {
  return /\d|road|street|avenue|floor|flat|unit|court|plaza|tower|building/i.test(query);
}

function toBuildingResult(b: (typeof buildings)[number]): SearchResult {
  return {
    type: "building",
    id: b.id,
    name: b.name,
    address: b.address,
    district: b.district,
    market: b.market,
    rating: b.avgRating,
    reviewCount: b.totalReviews,
    badge: b.statutoryOrders.some((o) => o.status === "Outstanding")
      ? "Orders on Record"
      : b.avgRating >= 4.2
      ? "Top Rated"
      : undefined,
    govDataAvailable: true,
  };
}

function toLandlordResult(l: (typeof landlords)[number]): SearchResult {
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

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Unified search across buildings and landlords.
 * Returns up to 8 results sorted by relevance.
 * Buildings are prioritised if the query looks like an address;
 * landlords are prioritised if it looks like a name.
 */
export function unifiedSearch(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const buildingResults = buildings
    .map((b) => ({ result: toBuildingResult(b), score: matchScore(query, b.name, b.address, b.district) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.result);

  const landlordResults = landlords
    .map((l) => ({
      result: toLandlordResult(l),
      score: matchScore(query, l.name, l.company, ...l.activeMarkets),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.result);

  const ordered = looksLikeAddress(query)
    ? [...buildingResults, ...landlordResults]
    : [...landlordResults, ...buildingResults];

  return ordered.slice(0, 8);
}

/**
 * Returns all buildings and landlords as SearchResult arrays —
 * used by the search page when no query is provided.
 */
export function getAllResults(): { buildings: SearchResult[]; landlords: SearchResult[] } {
  return {
    buildings: buildings.map(toBuildingResult),
    landlords: landlords.map(toLandlordResult),
  };
}
