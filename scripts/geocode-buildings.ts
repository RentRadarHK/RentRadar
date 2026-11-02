/**
 * Geocode buildings with the HK Government Address Lookup Service.
 *
 * Usage:
 *   npx tsx scripts/geocode-buildings.ts --dry-run --limit=5
 *   npx tsx scripts/geocode-buildings.ts --limit=50
 *   npx tsx scripts/geocode-buildings.ts --district="Central & Western"
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const ALS_URL = "https://www.als.gov.hk/lookup";
const DELAY_MS = 300;
const HK_ISLAND = {
  latMin: 22.18,
  latMax: 22.3,
  lngMin: 114.1,
  lngMax: 114.27,
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.replace("--limit=", ""), 10) : 50;
const districtArg = args.find((a) => a.startsWith("--district="));
const DISTRICT = districtArg ? districtArg.replace("--district=", "").replace(/^"|"$/g, "") : null;

type GeoStatus = "ok" | "not_found" | "error";

interface BuildingRow {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  latitude: number | null;
}

interface AlsResponse {
  SuggestedAddress?: Array<{
    Address?: {
      PremisesAddress?: {
        GeospatialInformation?: {
          Latitude?: string | number;
          Longitude?: string | number;
        };
      };
    };
  }>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inHongKongIsland(lat: number, lng: number): boolean {
  return (
    lat >= HK_ISLAND.latMin &&
    lat <= HK_ISLAND.latMax &&
    lng >= HK_ISLAND.lngMin &&
    lng <= HK_ISLAND.lngMax
  );
}

function parseCoords(data: AlsResponse): { lat: number; lng: number } | null {
  const geo =
    data.SuggestedAddress?.[0]?.Address?.PremisesAddress?.GeospatialInformation;
  if (!geo) return null;
  const lat = Number(geo.Latitude);
  const lng = Number(geo.Longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function lookupAddress(query: string, retried = false): Promise<AlsResponse> {
  const url = `${ALS_URL}?q=${encodeURIComponent(query)}&n=1`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "RentRadar-Geocoder/1.0",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as AlsResponse;
  } catch (err) {
    if (!retried) {
      await sleep(DELAY_MS);
      return lookupAddress(query, true);
    }
    throw err;
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log("RentRadar building geocoder");
  console.log(`  dry-run: ${DRY_RUN}`);
  console.log(`  limit:   ${LIMIT}`);
  if (DISTRICT) console.log(`  district: ${DISTRICT}`);

  let query = supabase
    .from("buildings")
    .select("id, name, address, district, latitude")
    .is("latitude", null)
    .order("id")
    .limit(LIMIT);

  if (DISTRICT) query = query.eq("district", DISTRICT);

  let { data, error } = await query;
  if (error && /latitude|schema cache|column/i.test(error.message)) {
    console.warn("latitude column not found yet. Run supabase/migrations/011_building_geocode.sql before writing results.");
    let fallback = supabase
      .from("buildings")
      .select("id, name, address, district")
      .order("id")
      .limit(LIMIT);
    if (DISTRICT) fallback = fallback.eq("district", DISTRICT);
    const retry = await fallback;
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    console.error("Failed to load buildings:", error.message);
    process.exit(1);
  }

  const buildings = (data ?? []) as BuildingRow[];
  console.log(`  queued:  ${buildings.length}`);

  let processed = 0;
  let ok = 0;
  let notFound = 0;
  let errors = 0;
  let loggedExample = false;

  for (const building of buildings) {
    const base = (building.address?.trim() || building.name).trim();
    const q = /hong kong/i.test(base) ? base : `${base}, Hong Kong`;

    let status: GeoStatus = "error";
    let lat: number | null = null;
    let lng: number | null = null;
    let note = "";

    try {
      const json = await lookupAddress(q);
      if (!loggedExample) {
        console.log("\n--- ALS example response ---");
        console.log(JSON.stringify(json, null, 2));
        console.log("--- end example ---\n");
        loggedExample = true;
      }

      const coords = parseCoords(json);
      if (!coords) {
        status = "not_found";
        note = "no coordinates in response";
      } else if (!inHongKongIsland(coords.lat, coords.lng)) {
        status = "not_found";
        note = `outside HK Island bounds (${coords.lat}, ${coords.lng})`;
      } else {
        status = "ok";
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (err) {
      status = "error";
      note = err instanceof Error ? err.message : String(err);
    }

    processed += 1;
    if (status === "ok") ok += 1;
    else if (status === "not_found") notFound += 1;
    else errors += 1;

    console.log(
      [
        status.toUpperCase().padEnd(10),
        building.name,
        lat != null && lng != null ? `${lat}, ${lng}` : note,
      ].join("  ")
    );

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from("buildings")
        .update({
          latitude: lat,
          longitude: lng,
          geocode_status: status,
          geocoded_at: new Date().toISOString(),
        })
        .eq("id", building.id);

      if (updateError) {
        errors += 1;
        ok = status === "ok" ? ok - 1 : ok;
        console.error(`  write failed: ${updateError.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  let remaining: number | string = "?";
  let remainingQuery = supabase
    .from("buildings")
    .select("id", { count: "exact", head: true })
    .is("latitude", null);
  if (DISTRICT) remainingQuery = remainingQuery.eq("district", DISTRICT);
  const remainingResult = await remainingQuery;
  if (!remainingResult.error) remaining = remainingResult.count ?? 0;

  console.log("\nSummary");
  console.log(`  processed: ${processed}`);
  console.log(`  ok:        ${ok}`);
  console.log(`  not_found: ${notFound}`);
  console.log(`  errors:    ${errors}`);
  console.log(`  remaining: ${remaining}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
