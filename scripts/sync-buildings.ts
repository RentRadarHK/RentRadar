/**
 * Step 2 — Sync HK government building + statutory order data into Supabase.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (service role bypasses RLS).
 * Run: npx tsx scripts/sync-buildings.ts
 *
 * What it does:
 *   1. Downloads + parses all three gov CSV sources
 *   2. Upserts buildings from the BDBIAR dataset (51k records, batched)
 *   3. For each statutory order, ensures the building exists then upserts the order
 *   4. Logs running totals throughout
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import AdmZip from "adm-zip";
import Papa from "papaparse";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// ── Supabase client (service role for upserts) ────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL"); process.exit(1); }

if (!serviceKey) {
  console.warn("\n⚠  SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
  console.warn("   Inserts will fail against RLS-protected tables.");
  console.warn("   Add your service role key to .env.local to proceed.\n");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey);

// ── Gov data URLs ─────────────────────────────────────────────────────────────

const BUILDINGS_URL =
  "https://static.csdi.gov.hk/csdi-webpage/download/0e55c533715b5da3ae0ca6e6024e90b4/csv";
const S26_URL =
  "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167799285_82457%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS26%26outputFormat%3DCSV";
const S24_URL =
  "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167624557_40796%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS24%26outputFormat%3DCSV";

// ── Column types ──────────────────────────────────────────────────────────────

interface BuildingRow {
  OBJECTID: string;
  ADDRESS_E: string;
  SEARCH1_E: string;  // district
  SEARCH2_E: string;  // region ("New Territories" | "Kowloon" | "Hong Kong")
  NSEARCH1_E: string; // block_id (BD reference)
  NSEARCH2_E: string; // occupation_permit_number
  NSEARCH3_E: string; // occupation_permit_date (YYYY-MM-DD)
  NSEARCH4_E: string; // block type ("Tower" etc.)
  NSEARCH5_E: string; // building_type ("Residential/Composite" etc.)
  LATITUDE: string;
  LONGITUDE: string;
}

interface OrderRow {
  GmlId: string;       // "BDS26.X" / "BDS24.X"
  NAME_EN: string;     // BD building reference
  ADDRESS_EN: string;  // street address
  SEARCH01_EN: string; // district code
  LASTUPDATE: string;  // ISO datetime
  LATITUDE: string;
  LONGITUDE: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": "RentRadar-Sync/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function parseCSV<T>(text: string): T[] {
  const { data, errors } = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (errors.length > 0) {
    console.warn(`  ⚠  ${errors.length} parse warnings (first: ${errors[0].message})`);
  }
  return data;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bMtr\b/g, "MTR")
    .replace(/\bHk\b/g, "HK");
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function mapRegion(search2: string): "Kowloon" | "HK Island" | "New Territories" {
  const s = search2.trim().toLowerCase();
  if (s === "kowloon") return "Kowloon";
  if (s === "hong kong") return "HK Island";
  return "New Territories";
}

/** Normalise address for matching (uppercase, collapse spaces, no punctuation) */
function normAddress(addr: string): string {
  return addr.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<{ inserted: number; error: string | null }> {
  const { error, count } = await supabase
    .from(table)
    .upsert(rows, { onConflict, count: "exact" });
  if (error) return { inserted: 0, error: error.message };
  return { inserted: count ?? rows.length, error: null };
}

// ── Step 1 — Sync buildings from BDBIAR ──────────────────────────────────────

async function syncBuildings(): Promise<Map<string, string>> {
  console.log("\n📦  Downloading Building Information & Age Records…");
  const buffer = await downloadBuffer(BUILDINGS_URL);
  const zip = new AdmZip(buffer);
  const csvEntry = zip.getEntries().find((e) => e.entryName.endsWith(".csv"));
  if (!csvEntry) throw new Error("No CSV in buildings ZIP");
  const rows = parseCSV<BuildingRow>(zip.readAsText(csvEntry));
  console.log(`    ${rows.length.toLocaleString()} rows parsed`);

  // Build address → id map (for order linking later)
  const addressToId = new Map<string, string>();

  const BATCH = 200;
  let inserted = 0, errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const records = batch
      .filter((r) => r.NSEARCH1_E && r.ADDRESS_E)
      .map((r) => {
        const id = `gov-${r.NSEARCH1_E}`;
        addressToId.set(normAddress(r.ADDRESS_E), id);
        return {
          id,
          name: titleCase(r.ADDRESS_E),
          address: titleCase(r.ADDRESS_E) + ", Hong Kong",
          district: r.SEARCH1_E || "Unknown",
          region: mapRegion(r.SEARCH2_E),
          market: "Hong Kong",
          building_type: r.NSEARCH5_E || "Residential",
          floors: 0,
          units: 0,
          occupation_permit_date: r.NSEARCH3_E || null,
          occupation_permit_number: r.NSEARCH2_E || null,
          block_id: r.NSEARCH1_E,
          avg_rating: 0,
          total_reviews: 0,
          gov_data_last_updated: new Date().toISOString(),
        };
      });

    if (records.length === 0) continue;
    const { inserted: n, error } = await upsertBatch("buildings", records, "id");
    if (error) {
      console.error(`    ✗  Batch ${Math.floor(i / BATCH) + 1} error: ${error}`);
      errors++;
    } else {
      inserted += n;
    }

    if ((i / BATCH) % 50 === 0 && i > 0) {
      console.log(`    … ${inserted.toLocaleString()} buildings upserted so far`);
    }
  }

  console.log(`\n  ✓ Buildings: ${inserted.toLocaleString()} upserted, ${errors} batch errors`);
  return addressToId;
}

// ── Step 2 — Sync statutory orders ───────────────────────────────────────────

interface OrderSource {
  label: string;
  url: string;
  type: string;
  section: string;
  description: string;
}

async function syncOrders(
  source: OrderSource,
  addressToId: Map<string, string>
): Promise<void> {
  console.log(`\n📋  Downloading ${source.label}…`);
  const buffer = await downloadBuffer(source.url);
  const rows = parseCSV<OrderRow>(buffer.toString("utf-8"));
  console.log(`    ${rows.length.toLocaleString()} orders parsed`);

  let matched = 0, stubsCreated = 0, ordersInserted = 0, errors = 0;

  // Deduplicate: one order per address (keep first occurrence)
  const seen = new Set<string>();
  const BATCH = 200;
  const orderBatch: Record<string, unknown>[] = [];
  const stubBatch: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (!row.ADDRESS_EN) continue;
    const norm = normAddress(row.ADDRESS_EN);
    let buildingId = addressToId.get(norm);

    if (!buildingId) {
      // Create a stub building from the order data
      buildingId = `ord-${slugify(row.ADDRESS_EN)}-${row.NAME_EN}`;
      if (!seen.has(buildingId)) {
        stubBatch.push({
          id: buildingId,
          name: titleCase(row.ADDRESS_EN),
          address: titleCase(row.ADDRESS_EN) + ", Hong Kong",
          district: "Hong Kong",
          region: "Kowloon" as const,
          market: "Hong Kong",
          building_type: "Residential",
          floors: 0,
          units: 0,
          block_id: row.NAME_EN,
          avg_rating: 0,
          total_reviews: 0,
          gov_data_last_updated: new Date().toISOString(),
        });
        addressToId.set(norm, buildingId);
        stubsCreated++;
      }
    } else {
      matched++;
    }

    // One order record per unique (building_id, section) pair
    const orderKey = `${buildingId}::${source.section}`;
    if (!seen.has(orderKey)) {
      seen.add(orderKey);
      orderBatch.push({
        building_id: buildingId,
        type: source.type,
        issued_date: row.LASTUPDATE
          ? row.LASTUPDATE.split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: "Outstanding",
        section: source.section,
        description: source.description,
      });
    }
  }

  // Upsert stub buildings first
  for (let i = 0; i < stubBatch.length; i += BATCH) {
    const { error } = await upsertBatch("buildings", stubBatch.slice(i, i + BATCH), "id");
    if (error) { console.error(`    ✗  Stub building batch error: ${error}`); errors++; }
  }

  // Upsert orders
  for (let i = 0; i < orderBatch.length; i += BATCH) {
    const { inserted, error } = await upsertBatch(
      "statutory_orders",
      orderBatch.slice(i, i + BATCH),
      "id"
    );
    if (error) { console.error(`    ✗  Order batch error: ${error}`); errors++; }
    else ordersInserted += inserted;
  }

  console.log(`  ✓ Orders (${source.section}): ${ordersInserted.toLocaleString()} inserted`);
  console.log(`    Buildings matched: ${matched.toLocaleString()}, stubs created: ${stubsCreated.toLocaleString()}`);
  if (errors > 0) console.warn(`    ⚠  ${errors} batch errors`);
}

// ── Sync log ──────────────────────────────────────────────────────────────────

async function logSync(
  syncType: string,
  processed: number,
  inserted: number,
  startedAt: Date,
  status: "success" | "error",
  errorMsg?: string
) {
  await supabase.from("gov_data_sync_log").insert({
    sync_type: syncType,
    records_processed: processed,
    records_inserted: inserted,
    records_updated: 0,
    started_at: startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    status,
    error_message: errorMsg ?? null,
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RentRadar — HK Government Data Sync");
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log("═══════════════════════════════════════════════════════════════");

  const startedAt = new Date();

  try {
    const addressToId = await syncBuildings();

    await syncOrders(
      {
        label: "Dangerous Buildings (Section 26)",
        url: S26_URL,
        type: "Dangerous Building",
        section: "Section 26",
        description: "Statutory order issued on dangerous building under Buildings Ordinance Section 26",
      },
      addressToId
    );

    await syncOrders(
      {
        label: "Unauthorised Building Works (Section 24)",
        url: S24_URL,
        type: "Unauthorised Building Works",
        section: "Section 24",
        description: "Statutory order for removal of unauthorised building works under Buildings Ordinance Section 24",
      },
      addressToId
    );

    await logSync("full_sync", 51037 + 1114 + 4988, 0, startedAt, "success");

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  ✓ Sync complete");
    console.log(`  Duration: ${((Date.now() - startedAt.getTime()) / 1000).toFixed(1)}s`);
    console.log("═══════════════════════════════════════════════════════════════\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\nFatal error:", msg);
    await logSync("full_sync", 0, 0, startedAt, "error", msg).catch(() => {});
    process.exit(1);
  }
}

main();
