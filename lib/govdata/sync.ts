/**
 * lib/govdata/sync.ts
 * Reusable module for fetching and syncing HK government building data.
 * Can be called on-demand or from the Supabase Edge Function scheduler.
 */

import AdmZip from "adm-zip";
import Papa from "papaparse";
import { SupabaseClient } from "@supabase/supabase-js";

// ── URLs ──────────────────────────────────────────────────────────────────────

export const GOV_DATA_URLS = {
  buildings:
    "https://static.csdi.gov.hk/csdi-webpage/download/0e55c533715b5da3ae0ca6e6024e90b4/csv",
  s26Orders:
    "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167799285_82457%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS26%26outputFormat%3DCSV",
  s24Orders:
    "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167624557_40796%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS24%26outputFormat%3DCSV",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  syncType: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  durationMs: number;
  status: "success" | "error";
  errorMessage?: string;
  lastSyncedAt: string;
}

export interface ParsedBuilding {
  id: string;
  name: string;
  address: string;
  district: string;
  region: "Kowloon" | "HK Island" | "New Territories";
  market: string;
  buildingType: string;
  blockId: string;
  occupationPermitNumber: string | null;
  occupationPermitDate: string | null;
}

export interface ParsedOrder {
  buildingAddress: string;
  type: string;
  section: string;
  issuedDate: string;
  status: "Outstanding";
  description: string;
  referenceNumber: string;
}

// ── fetchAndParseCSV ──────────────────────────────────────────────────────────

/**
 * Downloads a URL and returns parsed CSV rows.
 * Handles both plain CSV and ZIP-wrapped CSV responses.
 */
export async function fetchAndParseCSV<T = Record<string, string>>(
  url: string
): Promise<T[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "RentRadar-Sync/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await res.arrayBuffer());

  let csvText: string;

  if (
    contentType.includes("zip") ||
    contentType.includes("octet-stream") ||
    // Check magic bytes for ZIP (PK header)
    (buffer[0] === 0x50 && buffer[1] === 0x4b)
  ) {
    try {
      const zip = new AdmZip(buffer);
      const csvEntry = zip.getEntries().find((e) => e.entryName.endsWith(".csv"));
      if (!csvEntry) throw new Error("No CSV entry found in ZIP");
      csvText = zip.readAsText(csvEntry);
    } catch {
      // Fallback: treat as plain text
      csvText = buffer.toString("utf-8");
    }
  } else {
    csvText = buffer.toString("utf-8");
  }

  const { data } = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function normAddress(addr: string): string {
  return addr.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function mapRegion(search2: string): "Kowloon" | "HK Island" | "New Territories" {
  const s = search2.trim().toLowerCase();
  if (s === "kowloon") return "Kowloon";
  if (s === "hong kong") return "HK Island";
  return "New Territories";
}

// ── syncBuildingsFromGovData ──────────────────────────────────────────────────

/**
 * Downloads and upserts all buildings from the BDBIAR dataset.
 * Returns a Map of normalized address → building id for order linking.
 */
export async function syncBuildingsFromGovData(
  supabase: SupabaseClient,
  batchSize = 200
): Promise<{ addressToId: Map<string, string>; processed: number; inserted: number }> {
  type Row = {
    NSEARCH1_E: string; ADDRESS_E: string; SEARCH1_E: string;
    SEARCH2_E: string; NSEARCH2_E: string; NSEARCH3_E: string; NSEARCH5_E: string;
  };

  const rows = await fetchAndParseCSV<Row>(GOV_DATA_URLS.buildings);
  const addressToId = new Map<string, string>();
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const records = rows
      .slice(i, i + batchSize)
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
    const { count } = await supabase
      .from("buildings")
      .upsert(records, { onConflict: "id", count: "exact" });
    inserted += count ?? records.length;
  }

  return { addressToId, processed: rows.length, inserted };
}

// ── syncStatutoryOrders ───────────────────────────────────────────────────────

/**
 * Downloads and upserts statutory orders for both Section 26 and Section 24.
 * Creates stub buildings for addresses not already in the buildings table.
 */
export async function syncStatutoryOrders(
  supabase: SupabaseClient,
  addressToId: Map<string, string>,
  batchSize = 200
): Promise<{ processed: number; inserted: number }> {
  const sources = [
    {
      url: GOV_DATA_URLS.s26Orders,
      type: "Dangerous Building",
      section: "Section 26",
      description: "Statutory order issued on dangerous building under Buildings Ordinance Section 26",
    },
    {
      url: GOV_DATA_URLS.s24Orders,
      type: "Unauthorised Building Works",
      section: "Section 24",
      description: "Statutory order for removal of unauthorised building works under Buildings Ordinance Section 24",
    },
  ];

  let totalProcessed = 0;
  let totalInserted = 0;

  for (const source of sources) {
    type Row = { GmlId: string; NAME_EN: string; ADDRESS_EN: string; LASTUPDATE: string };
    const rows = await fetchAndParseCSV<Row>(source.url);
    totalProcessed += rows.length;

    const seen = new Set<string>();
    const stubBuildings: Record<string, unknown>[] = [];
    const orders: Record<string, unknown>[] = [];

    for (const row of rows) {
      if (!row.ADDRESS_EN) continue;
      const norm = normAddress(row.ADDRESS_EN);
      let buildingId = addressToId.get(norm);

      if (!buildingId) {
        buildingId = `ord-${row.NAME_EN}`;
        if (!seen.has(`stub:${buildingId}`)) {
          stubBuildings.push({
            id: buildingId,
            name: titleCase(row.ADDRESS_EN),
            address: titleCase(row.ADDRESS_EN) + ", Hong Kong",
            district: "Hong Kong",
            region: "Kowloon",
            market: "Hong Kong",
            building_type: "Residential",
            floors: 0, units: 0,
            block_id: row.NAME_EN,
            avg_rating: 0, total_reviews: 0,
            gov_data_last_updated: new Date().toISOString(),
          });
          addressToId.set(norm, buildingId);
          seen.add(`stub:${buildingId}`);
        }
      }

      const orderKey = `${buildingId}::${source.section}`;
      if (!seen.has(orderKey)) {
        seen.add(orderKey);
        orders.push({
          building_id: buildingId,
          type: source.type,
          issued_date: row.LASTUPDATE?.split("T")[0] ?? new Date().toISOString().split("T")[0],
          status: "Outstanding",
          section: source.section,
          description: source.description,
        });
      }
    }

    // Upsert stubs then orders in batches
    for (let i = 0; i < stubBuildings.length; i += batchSize) {
      await supabase.from("buildings").upsert(stubBuildings.slice(i, i + batchSize), { onConflict: "id" });
    }
    for (let i = 0; i < orders.length; i += batchSize) {
      const { count } = await supabase
        .from("statutory_orders")
        .upsert(orders.slice(i, i + batchSize), { onConflict: "id", count: "exact" });
      totalInserted += count ?? orders.slice(i, i + batchSize).length;
    }
  }

  return { processed: totalProcessed, inserted: totalInserted };
}

// ── Full sync entry point ─────────────────────────────────────────────────────

/**
 * Runs a full sync: buildings → statutory orders → writes sync log.
 * Pass a Supabase client initialised with the service role key.
 */
export async function runFullSync(supabase: SupabaseClient): Promise<SyncResult> {
  const startedAt = Date.now();
  const startedAtISO = new Date().toISOString();

  try {
    const { addressToId, processed: bProcessed, inserted: bInserted } =
      await syncBuildingsFromGovData(supabase);

    const { processed: oProcessed, inserted: oInserted } =
      await syncStatutoryOrders(supabase, addressToId);

    const result: SyncResult = {
      syncType: "full_sync",
      recordsProcessed: bProcessed + oProcessed,
      recordsInserted: bInserted + oInserted,
      recordsUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "success",
      lastSyncedAt: new Date().toISOString(),
    };

    await supabase.from("gov_data_sync_log").insert({
      sync_type: result.syncType,
      records_processed: result.recordsProcessed,
      records_inserted: result.recordsInserted,
      records_updated: 0,
      started_at: startedAtISO,
      completed_at: result.lastSyncedAt,
      status: "success",
      error_message: null,
    });

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const result: SyncResult = {
      syncType: "full_sync",
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
      errorMessage,
      lastSyncedAt: new Date().toISOString(),
    };
    await supabase.from("gov_data_sync_log").insert({
      sync_type: result.syncType,
      records_processed: 0,
      records_inserted: 0,
      records_updated: 0,
      started_at: startedAtISO,
      completed_at: result.lastSyncedAt,
      status: "error",
      error_message: errorMessage,
    });
    return result;
  }
}
