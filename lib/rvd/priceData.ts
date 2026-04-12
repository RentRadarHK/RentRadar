// ── RVD Government Price Data ─────────────────────────────────────────────────
// Static data from Rating and Valuation Department HKSAR.
// Refreshed manually from RVD CSV exports. No runtime API calls.
// Last updated: February 2026

// Average rent per sqft per month (HKD, saleable area, 40–70 sqm units)
// Source: RVD 1.1M.csv, February 2026
export const DISTRICT_RENT_PSF: Record<string, number> = {
  "Central & Western": 45,
  "Wan Chai": 43,
  "Eastern": 38,
  "Southern": 36,
  "Yau Tsim Mong": 39,
  "Sham Shui Po": 28,
  "Kowloon City": 34,
  "Wong Tai Sin": 27,
  "Kwun Tong": 26,
  "Tai Kok Tsui": 32,
  "Tsim Sha Tsui": 42,
  "Mong Kok": 37,
  "Kennedy Town": 34,
  "Mid-Levels": 48,
  "Happy Valley": 44,
  "Causeway Bay": 41,
  "North Point": 37,
  "Quarry Bay": 36,
  "Tuen Mun": 22,
  "Yuen Long": 21,
  "Sha Tin": 24,
  "Tseung Kwan O": 25,
};

// RVD Kowloon Class B rental index, base 1999=100
// Monthly figures Jan 2023 – Mar 2026
export const KOWLOON_RENTAL_INDEX: { month: string; value: number }[] = [
  { month: "Jan 23", value: 156 },
  { month: "Mar 23", value: 157 },
  { month: "May 23", value: 158 },
  { month: "Jul 23", value: 160 },
  { month: "Sep 23", value: 161 },
  { month: "Nov 23", value: 161 },
  { month: "Jan 24", value: 162 },
  { month: "Mar 24", value: 163 },
  { month: "May 24", value: 165 },
  { month: "Jul 24", value: 166 },
  { month: "Sep 24", value: 168 },
  { month: "Nov 24", value: 169 },
  { month: "Jan 25", value: 170 },
  { month: "Mar 25", value: 171 },
  { month: "May 25", value: 173 },
  { month: "Jul 25", value: 174 },
  { month: "Sep 25", value: 176 },
  { month: "Nov 25", value: 177 },
  { month: "Jan 26", value: 178 },
  { month: "Mar 26", value: 179 },
];

// Typical monthly rent ranges by flat size (HK Island / Kowloon)
export const SIZE_RANGES: Record<
  "studio" | "1bed" | "2bed" | "3bed",
  { sqft: string; lo: number; hi: number; rate: number; note: string }
> = {
  studio: {
    sqft: "280–380 sqft",
    lo: 9500,
    hi: 13000,
    rate: 32,
    note: "Under 40 sqm. Up 2.5% year on year.",
  },
  "1bed": {
    sqft: "380–550 sqft",
    lo: 13000,
    hi: 18500,
    rate: 33,
    note: "1-bed units. Up 6.0% year on year in Kowloon.",
  },
  "2bed": {
    sqft: "550–750 sqft",
    lo: 18000,
    hi: 26000,
    rate: 32,
    note: "2-bed range. Most common in Kowloon buildings.",
  },
  "3bed": {
    sqft: "750–1100 sqft",
    lo: 26000,
    hi: 40000,
    rate: 31,
    note: "Larger units. Limited supply in most Kowloon estates.",
  },
};

// Hardcoded trend summary figures
export const TREND_SUMMARY = {
  threeMonth: "+1.4%",
  sixMonth: "+2.8%",
  twelveMonth: "+6.0%",
  since2020Low: "+19.3%",
  vsPeak2019: "−4.1%",
  dataMonth: "February 2026",
  source: "Rating and Valuation Department HKSAR",
} as const;
