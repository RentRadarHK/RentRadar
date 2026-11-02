import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

const BATCH = 1000;

const STATIC_PATHS = [
  "/",
  "/about",
  "/how-it-works",
  "/for-landlords",
  "/pricing",
  "/review",
  "/search",
  "/terms",
  "/sign-in",
  "/signup",
  "/forgot-password",
];

async function fetchAllRows<T>(
  table: string,
  columns: string
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH - 1;
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, to);

    if (error) {
      console.error(`sitemap ${table} fetch failed:`, error.message);
      break;
    }

    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < BATCH) break;
    from += BATCH;
  }

  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const buildings = await fetchAllRows<{
    id: string;
    gov_data_last_updated: string | null;
  }>("buildings", "id, gov_data_last_updated");

  const buildingEntries: MetadataRoute.Sitemap = buildings.map((row) => ({
    url: `${SITE_URL}/building/${row.id}`,
    lastModified: row.gov_data_last_updated
      ? new Date(row.gov_data_last_updated)
      : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const landlords = await fetchAllRows<{
    id: string;
    verified_date: string | null;
  }>("landlords", "id, verified_date");

  const landlordEntries: MetadataRoute.Sitemap = landlords.map((row) => ({
    url: `${SITE_URL}/landlord/${row.id}`,
    lastModified: row.verified_date ? new Date(row.verified_date) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...buildingEntries, ...landlordEntries];
}
