/**
 * Step 1 — Download, parse, and inspect HK government CSV data.
 * Prints column headers, row counts, and saves 5-row samples to /scripts/samples/.
 *
 * Run: npx tsx scripts/import-hk-gov-data.ts
 */

import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import Papa from "papaparse";

// ── Data sources ─────────────────────────────────────────────────────────────

const SOURCES = [
  {
    key: "buildings",
    label: "Building Information & Age Records",
    url: "https://static.csdi.gov.hk/csdi-webpage/download/0e55c533715b5da3ae0ca6e6024e90b4/csv",
    isZip: true,
  },
  {
    key: "orders_s26",
    label: "Statutory Orders — Dangerous Buildings (Section 26)",
    url: "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167799285_82457%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS26%26outputFormat%3DCSV",
    isZip: false,
  },
  {
    key: "orders_s24",
    label: "Statutory Orders — Unauthorised Building Works (Section 24)",
    url: "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fportal.csdi.gov.hk%2Fserver%2Fservices%2Fcommon%2Fbd_rcd_1631167624557_40796%2FMapServer%2FWFSServer%3Fservice%3Dwfs%26request%3DGetFeature%26typename%3DBDS24%26outputFormat%3DCSV",
    isZip: false,
  },
] as const;

const SAMPLES_DIR = path.join(process.cwd(), "scripts", "samples");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "RentRadar-DataPipeline/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractCSVFromZip(buffer: Buffer): { name: string; text: string } {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  console.log(`   ZIP entries  : ${entries.map((e) => e.entryName).join(", ")}`);
  const csvEntry = entries.find((e) => e.entryName.toLowerCase().endsWith(".csv"));
  if (!csvEntry) throw new Error("No CSV file found inside ZIP");
  return { name: csvEntry.entryName, text: zip.readAsText(csvEntry) };
}

function parseCSV(csvText: string): Papa.ParseResult<Record<string, string>> {
  return Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
}

function saveSample(key: string, rows: Record<string, string>[]): void {
  const filePath = path.join(SAMPLES_DIR, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows.slice(0, 5), null, 2), "utf-8");
  console.log(`   Sample saved : scripts/samples/${key}.json`);
}

function printResult(
  label: string,
  data: Record<string, string>[],
  fields: string[] | undefined
) {
  console.log(`\n   ┌─ ${label}`);
  console.log(`   │  Total rows : ${data.length.toLocaleString()}`);
  console.log(`   │  Columns    : ${fields?.length ?? "?"}`);
  console.log(`   │`);
  console.log(`   │  COLUMN HEADERS:`);
  (fields ?? []).forEach((f, i) =>
    console.log(`   │    [${String(i).padStart(2, "0")}] ${f}`)
  );
  if (data.length > 0) {
    console.log(`   │`);
    console.log(`   │  SAMPLE ROW (row 1):`);
    Object.entries(data[0])
      .slice(0, 14)
      .forEach(([k, v]) => console.log(`   │    ${k.padEnd(32)} → "${v}"`));
    const extra = Object.keys(data[0]).length - 14;
    if (extra > 0) console.log(`   │    … (${extra} more fields)`);
  }
  console.log(`   └──`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RentRadar — HK Government Data Inspector");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true });

  for (const source of SOURCES) {
    console.log(`\n⬇  Downloading: ${source.label}`);
    console.log(`   ${source.url.slice(0, 90)}${source.url.length > 90 ? "…" : ""}`);

    try {
      const buffer = await downloadBuffer(source.url);
      console.log(`   Size         : ${(buffer.length / 1024).toFixed(1)} KB`);

      let csvText: string;
      if (source.isZip) {
        const extracted = extractCSVFromZip(buffer);
        console.log(`   Extracted    : ${extracted.name}`);
        csvText = extracted.text;
      } else {
        csvText = buffer.toString("utf-8");
      }

      const { data, errors, meta } = parseCSV(csvText);
      if (errors.length > 0) {
        console.warn(`   ⚠  Parse warnings (first 3): ${errors.slice(0, 3).map((e) => e.message).join(" | ")}`);
      }

      printResult(source.label, data, meta.fields);
      saveSample(source.key, data);
    } catch (err) {
      console.error(`\n   ✗  Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Done. Review column headers above, then run sync-buildings.ts");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
