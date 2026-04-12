/**
 * sync-buildings-hk-island.ts
 *
 * Downloads the HKSAR Buildings Department CSV, filters to HK Island
 * residential buildings only, cleans and deduplicates, then upserts
 * into Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-buildings-hk-island.ts            # real import
 *   npx tsx scripts/sync-buildings-hk-island.ts --dry-run  # inspect only
 */

import * as path from "path";
import * as dotenv from "dotenv";
import AdmZip from "adm-zip";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// ── Config ────────────────────────────────────────────────────────────────────

const BUILDINGS_URL =
  "https://static.csdi.gov.hk/csdi-webpage/download/0e55c533715b5da3ae0ca6e6024e90b4/csv";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;
const DRY_RUN_SAMPLE = 20;

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawRow {
  ADDRESS_E: string;
  SEARCH1_E: string;   // district
  SEARCH2_E: string;   // region
  NSEARCH1_E: string;  // block_id
  NSEARCH2_E: string;  // occupation_permit_number
  NSEARCH3_E: string;  // occupation_permit_date
  NSEARCH5_E: string;  // building_type
}

interface CleanedBuilding {
  name: string;                       // cleaned parent name
  raw_name: string;                   // original ADDRESS_E
  address: string;                    // raw_name + ", Hong Kong"
  district: string;                   // normalised district
  region: string;                     // always "HK Island"
  market: string;                     // always "Hong Kong"
  building_type: string;
  occupation_permit_number: string;
  occupation_permit_date: string | null;
  block_count: number;
  block_ids: string;                  // comma-separated
  data_source: string;
  is_verified: boolean;
  // internal dedup key — not written to DB
  _key: string;
  _blockId: string;
  _date: string;
}

// ── Download ──────────────────────────────────────────────────────────────────

async function downloadCsv(): Promise<RawRow[]> {
  console.log("  Downloading buildings dataset…");
  const res = await fetch(BUILDINGS_URL, {
    headers: { "User-Agent": "RentRadar-Sync/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${BUILDINGS_URL}`);

  const buf = Buffer.from(await res.arrayBuffer());

  // The endpoint returns a ZIP containing a single CSV
  let csvText: string;
  try {
    const zip = new AdmZip(buf);
    const entry = zip.getEntries().find((e) => e.entryName.endsWith(".csv"));
    if (!entry) throw new Error("No CSV found inside ZIP");
    csvText = zip.readAsText(entry);
  } catch {
    // Fallback: maybe it's a raw CSV
    csvText = buf.toString("utf-8");
  }

  const { data, errors } = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length > 0) {
    console.warn(`  ⚠  ${errors.length} parse warning(s) — first: ${errors[0].message}`);
  }

  return data;
}

// ── HK Island filter ──────────────────────────────────────────────────────────

function isHkIsland(row: RawRow): boolean {
  const s = (row.SEARCH2_E ?? "").trim().toUpperCase();
  return (
    s === "HONG KONG" ||
    s === "HK ISLAND" ||
    s === "HONG KONG ISLAND"
  );
}

// ── Residential filter ────────────────────────────────────────────────────────

const SKIP_TYPES = [
  "INDUSTRIAL", "FACTORY", "WAREHOUSE",
  "CAR PARK", "CARPARK",
  "SCHOOL", "COLLEGE", "UNIVERSITY",
  "HOSPITAL", "CLINIC",
  "CHURCH", "TEMPLE", "MOSQUE",
  "GOVERNMENT",
  "OFFICE",
  "SHOP", "RETAIL",
  "THEATRE",
  "SHOPPING CENTRE",
];

const KEEP_TYPES = [
  "DOMESTIC", "RESIDENTIAL", "COMPOSITE",
  "PRIVATE", "APARTMENT", "FLAT",
  "MANSION", "COURT", "GARDEN", "VILLA",
  "TERRACE", "HEIGHT", "ESTATE", "HOUSE",
];

/**
 * Words/patterns that indicate a non-residential structure when found in the
 * building name (ADDRESS_E). Each entry is either a plain string (checked with
 * .includes()) or a regex for cases that need smarter matching.
 */
const SKIP_NAME_TERMS: Array<string | RegExp> = [
  // Infrastructure
  "SUBSTATION",
  "REFUSE",
  "PUMP HOUSE",
  "PUMPHOUSE",
  /\bSTORAGE\b/,
  /\bSTORE\b(?! ?Y)/,      // "STORE" but not "STOREY" / "STORE Y"
  "KIOSK",
  /\bSHELTER\b(?! ST\b)(?! STREET\b)/,  // "SHELTER" but not "SHELTER STREET"
  "DEPOT",
  "PORTAL",
  "TRANSFORMER",
  "METER ROOM",
  "SWITCH ROOM",
  "SWITCHING STATION",
  "TOILET",
  "SHRINE",
  "CEMETERY",
  "OSSARY",
  "OSSARIUM",
  "TEMPORARY STRUCTURE",
  /\bSIGNAL\b/,
  "INTAKE",
  "VENTILATION",
  // Organizations / social facilities
  "ASSOCIATION",
  "FEDERATION OF YOUTH",
  "TUBERCULOSIS",
  /BOYS['']?\s*&\s*GIRLS['']?/,
  // Government land codes
  /\bGLP\b/,
  /\bDD\s+\d/,
  // Garbled data
  /(&AMP;.*){2}/,  // two or more HTML entities
];

/** Returns true when the name contains a non-residential indicator. */
function hasNonResidentialName(name: string): boolean {
  const upper = name.toUpperCase();
  return SKIP_NAME_TERMS.some((term) =>
    typeof term === "string" ? upper.includes(term) : term.test(upper)
  );
}

function isResidential(row: RawRow): boolean {
  const type = (row.NSEARCH5_E ?? "").toUpperCase();
  const name = (row.ADDRESS_E ?? "").toUpperCase();
  const combined = type + " " + name;

  // Reject names that start with a floor reference (e.g. "3/F-Shop", "1F: Lobby")
  if (/^\d+\/F/i.test(name) || /^\d+F[-\s:]/i.test(name)) return false;

  // Reject on building name keywords first (catches infra slipping through type)
  if (hasNonResidentialName(name)) return false;

  // Hotel: skip unless it's a serviced apartment
  if (combined.includes("HOTEL")) {
    return combined.includes("SERVICED APARTMENT");
  }

  // PUBLIC: skip unless explicitly residential
  if (type.includes("PUBLIC") && !KEEP_TYPES.some((k) => type.includes(k))) {
    return false;
  }

  // COMMERCIAL as standalone: skip
  if (type === "COMMERCIAL") return false;

  // Hard skip list
  for (const skip of SKIP_TYPES) {
    if (combined.includes(skip)) return false;
  }

  // Explicit keep list on building type field
  for (const keep of KEEP_TYPES) {
    if (type.includes(keep)) return true;
  }

  // TOWER: keep only if name has a residential keyword
  if (name.includes("TOWER")) {
    return KEEP_TYPES.some((k) => name.includes(k)) || type.includes("RESIDENTIAL");
  }

  // BUILDING: keep if no industrial/commercial indicator in combined string
  if (type.includes("BUILDING") || (!type && name.includes("BUILDING"))) {
    return !SKIP_TYPES.some((s) => combined.includes(s));
  }

  return false;
}

// ── Name cleaning ─────────────────────────────────────────────────────────────

const STRIP_PATTERNS: RegExp[] = [
  // ── Floor-plan descriptions: truncate everything from the marker onwards ──
  /,.*$/g,                                           // everything after first comma
  /\s+G\/F\b.*/gi,                                   // "G/F ..." (ground floor)
  /\s+GF\s*[:,.].*/gi,                               // "Gf:" / "GF,"
  /\s+GROUND\s+FLOOR\b.*/gi,                         // "Ground Floor ..."
  /\s+\d+[SF]\s*[-:].*/gi,                           // "1F-..." / "1S-..."
  /\s+\d+\/F\b.*/gi,                                 // "1/F ..."
  /\s+\d+F-\d+F\b.*/gi,                              // "1F-19F ..."
  // ── Block / tower designators ─────────────────────────────────────────────
  /\s+TOWER\s+BLOCK\s+[A-Z0-9]+/gi,
  /\s+(?:BLK|BLOCK)\s+[A-Z0-9]+/gi,
  /\s+TOWER\s+[0-9A-Z]+/gi,
  /\s+PH\s+[0-9]+/gi,
  /\s+PHASE\s+[0-9]+/gi,
  /\s+STAGE\s+[0-9]+/gi,
  /\s+PORTION\s+[A-Z]+/gi,
  /\s+[A-Z]$/g,                                      // trailing single letter
];

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    // Keep common HK abbreviations uppercase
    .replace(/\bHk\b/g, "HK")
    .replace(/\bMtr\b/g, "MTR")
    .replace(/\bNt\b/g,  "NT");
}

function cleanName(raw: string): string {
  let name = raw.trim().toUpperCase();

  for (const pattern of STRIP_PATTERNS) {
    name = name.replace(pattern, "").trim();
  }

  return toTitleCase(name);
}

/** Returns true if the cleaned name is just a number or short code (e.g. "123", "1A") */
function isTrivialName(name: string): boolean {
  return /^[0-9A-Z]{1,4}$/.test(name.trim());
}

// ── District normalisation ────────────────────────────────────────────────────

const DISTRICT_MAP: Record<string, string> = {
  "CENTRAL": "Central & Western",
  "CENTRAL & WESTERN": "Central & Western",
  "CENTRAL AND WESTERN": "Central & Western",
  "WAN CHAI": "Wan Chai",
  "WANCHAI": "Wan Chai",
  "EASTERN": "Eastern",
  "SOUTHERN": "Southern",
  "ABERDEEN": "Southern",
  "STANLEY": "Southern",
  "CAUSEWAY BAY": "Wan Chai",
  "HAPPY VALLEY": "Wan Chai",
  "MID-LEVELS": "Central & Western",
  "MIDLEVELS": "Central & Western",
  "MID LEVELS": "Central & Western",
  "KENNEDY TOWN": "Central & Western",
  "SAI WAN HO": "Eastern",
  "SHAU KEI WAN": "Eastern",
  "CHAI WAN": "Eastern",
};

const unmatchedDistricts = new Set<string>();

function normaliseDistrict(raw: string): string {
  const key = raw.trim().toUpperCase();
  if (DISTRICT_MAP[key]) return DISTRICT_MAP[key];
  unmatchedDistricts.add(raw.trim());
  return toTitleCase(raw.trim());
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateBuildings(rows: RawRow[]): CleanedBuilding[] {
  // Map from "name|district" → accumulated data
  const groups = new Map<string, {
    first: RawRow;
    cleanedName: string;
    district: string;
    blockIds: Set<string>;
    dates: string[];
    count: number;
  }>();

  for (const row of rows) {
    const rawName = (row.ADDRESS_E ?? "").trim();
    const cleanedName = cleanName(rawName);

    if (!cleanedName || isTrivialName(cleanedName)) continue;

    const district = normaliseDistrict(row.SEARCH1_E ?? "");
    const key = `${cleanedName.toLowerCase()}|${district.toLowerCase()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        first: row,
        cleanedName,
        district,
        blockIds: new Set(),
        dates: [],
        count: 0,
      });
    }

    const g = groups.get(key)!;
    g.count++;
    if (row.NSEARCH1_E) g.blockIds.add(row.NSEARCH1_E);
    if (row.NSEARCH3_E) g.dates.push(row.NSEARCH3_E);
  }

  return Array.from(groups.values()).map((g) => {
    const { first, cleanedName, district } = g;

    // Earliest occupation permit date
    const sortedDates = [...g.dates].sort();
    const earliestDate = sortedDates[0] ?? null;

    const rawName = (first.ADDRESS_E ?? "").trim();

    return {
      name: cleanedName,
      raw_name: toTitleCase(rawName),
      address: `${cleanedName}, Hong Kong`,
      district,
      region: "HK Island",
      market: "Hong Kong",
      building_type: toTitleCase(first.NSEARCH5_E ?? "Residential"),
      occupation_permit_number: first.NSEARCH2_E ?? "",
      occupation_permit_date: earliestDate,
      block_count: g.count,
      block_ids: Array.from(g.blockIds).join(","),
      data_source: "hksar_bd",
      is_verified: true,
      _key: `${cleanedName.toLowerCase()}|${district.toLowerCase()}`,
      _blockId: first.NSEARCH1_E ?? "",
      _date: earliestDate ?? "",
    };
  });
}

// ── Migration ─────────────────────────────────────────────────────────────────

const MIGRATION_SQL = `
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS raw_name    TEXT,
  ADD COLUMN IF NOT EXISTS block_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS block_ids   TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
`.trim();

async function ensureMigration(supabaseUrl: string, serviceKey: string): Promise<void> {
  // Probe for block_count column — 400 means it doesn't exist yet
  const probe = await fetch(
    `${supabaseUrl}/rest/v1/buildings?select=block_count&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );

  if (probe.ok) return; // columns already exist

  // Column missing — print migration and exit
  console.error(`
  ✗ The buildings table is missing required columns.
    Run the following SQL in your Supabase SQL editor, then re-run this script:

    ┌─────────────────────────────────────────────────────────┐
${MIGRATION_SQL.split("\n").map((l) => `    │  ${l}`).join("\n")}
    └─────────────────────────────────────────────────────────┘

    Supabase SQL editor: https://supabase.com/dashboard/project/_/sql
`);
  process.exit(1);
}

// ── Supabase upsert ───────────────────────────────────────────────────────────

async function upsertBuildings(
  buildings: CleanedBuilding[]
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Ensure schema is up to date before importing
  await ensureMigration(supabaseUrl, serviceKey);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < buildings.length; i += BATCH_SIZE) {
    const batch = buildings.slice(i, i + BATCH_SIZE);

    const records = batch.map(({ _key, _blockId, _date, ...b }) => ({
      id: `hki-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${b.district.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: b.name,
      raw_name: b.raw_name,
      address: b.address,
      district: b.district,
      region: b.region,
      market: b.market,
      building_type: b.building_type,
      occupation_permit_number: b.occupation_permit_number,
      occupation_permit_date: b.occupation_permit_date,
      block_count: b.block_count,
      block_ids: b.block_ids,
      data_source: b.data_source,
      is_verified: b.is_verified,
      block_id: b.block_ids.split(",")[0] ?? "",  // keep legacy column populated
      floors: 0,
      units: 0,
      avg_rating: 0,
      total_reviews: 0,
      gov_data_last_updated: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from("buildings")
      .upsert(records, { onConflict: "id", count: "exact" });

    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
      skipped += batch.length;
    } else {
      inserted += count ?? batch.length;
      if ((i / BATCH_SIZE) % 10 === 0 && i > 0) {
        console.log(`  … ${inserted.toLocaleString()} upserted so far`);
      }
    }
  }

  return { inserted, updated: 0, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const sep = "═".repeat(60);
  console.log(sep);
  console.log("  RentRadar — HK Island Buildings Sync");
  if (DRY_RUN) console.log("  MODE: DRY RUN — no data will be written");
  console.log(sep);

  const startedAt = Date.now();

  // ── 1. Download ──
  const allRows = await downloadCsv();
  console.log(`\n  Downloaded ${allRows.length.toLocaleString()} total records`);

  // ── 2. HK Island filter ──
  const hkIslandRows = allRows.filter(isHkIsland);
  console.log(`  ${hkIslandRows.length.toLocaleString()} records on HK Island`);

  // ── 3. Residential filter ──
  const residentialRows = hkIslandRows.filter(isResidential);
  console.log(`  ${residentialRows.length.toLocaleString()} records after residential filter`);

  // ── 4 & 5. Name cleaning + deduplication ──
  const deduplicated = deduplicateBuildings(residentialRows);
  console.log(`  ${deduplicated.length.toLocaleString()} records after deduplication`);
  console.log(`  ${deduplicated.length.toLocaleString()} records ready to import`);

  // ── 6. District unmatched report ──
  if (unmatchedDistricts.size > 0) {
    console.log(`\n  ⚠  Unmatched districts (kept as-is):`);
    for (const d of Array.from(unmatchedDistricts)) {
      console.log(`     "${d}"`);
    }
  }

  // ── Dry run sample ──
  if (DRY_RUN) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`  SAMPLE — first ${DRY_RUN_SAMPLE} cleaned records:`);
    console.log("─".repeat(60));

    const sample = deduplicated.slice(0, DRY_RUN_SAMPLE);
    for (const b of sample) {
      console.log(`
  name              : ${b.name}
  raw_name          : ${b.raw_name}
  district          : ${b.district}
  region            : ${b.region}
  building_type     : ${b.building_type}
  permit_number     : ${b.occupation_permit_number}
  permit_date       : ${b.occupation_permit_date ?? "—"}
  block_count       : ${b.block_count}
  block_ids         : ${b.block_ids.split(",").slice(0, 4).join(", ")}${b.block_ids.split(",").length > 4 ? " …" : ""}
  is_verified       : ${b.is_verified}
  data_source       : ${b.data_source}`);
    }

    console.log(`\n${"─".repeat(60)}`);

    // District breakdown
    const byDistrict = new Map<string, number>();
    for (const b of deduplicated) {
      byDistrict.set(b.district, (byDistrict.get(b.district) ?? 0) + 1);
    }
    console.log(`\n  District breakdown:`);
    for (const [district, count] of Array.from(byDistrict.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${district.padEnd(22)} ${count.toLocaleString()}`);
    }

    // Building type breakdown
    const byType = new Map<string, number>();
    for (const b of deduplicated) {
      byType.set(b.building_type, (byType.get(b.building_type) ?? 0) + 1);
    }
    console.log(`\n  Building type breakdown (top 10):`);
    for (const [type, count] of Array.from(byType.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`     ${type.padEnd(30)} ${count.toLocaleString()}`);
    }

    console.log(`\n  Dry run complete. Re-run without --dry-run to import.`);
  } else {
    // ── Real import ──
    console.log(`\n  Importing to Supabase…`);
    const { inserted, skipped } = await upsertBuildings(deduplicated);
    const duration = ((Date.now() - startedAt) / 1000).toFixed(1);

    console.log(`\n${sep}`);
    console.log(`  Import complete`);
    console.log(`    Inserted / updated : ${inserted.toLocaleString()}`);
    console.log(`    Skipped (errors)   : ${skipped.toLocaleString()}`);
    console.log(`    Duration           : ${duration}s`);
    console.log(sep);
  }
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
