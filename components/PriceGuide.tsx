"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, PenLine } from "lucide-react";
import Link from "next/link";
import {
  DISTRICT_RENT_PSF,
  KOWLOON_RENTAL_INDEX,
  SIZE_RANGES,
  TREND_SUMMARY,
} from "@/lib/rvd/priceData";

// ── Types ─────────────────────────────────────────────────────────────────────

type FlatSize = "studio" | "1bed" | "2bed" | "3bed";
export type PriceGuideRegion = "kowloon" | "hk_island" | "new_territories";

export interface PriceGuideProps {
  buildingName: string;
  district: string;
  region: PriceGuideRegion;
  buildingId?: string;
  landlordId?: string;
}

// ── Comparison districts by region ───────────────────────────────────────────

const COMPARISON_DISTRICTS: Record<PriceGuideRegion, string[]> = {
  kowloon: ["Mong Kok", "Tsim Sha Tsui", "Sham Shui Po", "Kowloon City"],
  hk_island: ["Wan Chai", "Central & Western", "Eastern", "Causeway Bay"],
  new_territories: ["Sha Tin", "Tseung Kwan O", "Tuen Mun", "Yuen Long"],
};

const REGION_LABEL: Record<PriceGuideRegion, string> = {
  hk_island: "HK Island",
  kowloon: "Kowloon",
  new_territories: "NT",
};

const SIZE_LABELS: Record<FlatSize, string> = {
  studio: "Studio",
  "1bed": "1 bed",
  "2bed": "2 bed",
  "3bed": "3 bed",
};

// ── SVG Trend Chart ───────────────────────────────────────────────────────────

function TrendChart() {
  const W = 600;
  const H = 160;
  const PAD_X = 10;
  const PAD_Y = 18;
  const data = KOWLOON_RENTAL_INDEX;
  const values = data.map((d) => d.value);
  const minV = Math.min(...values) - 3;
  const maxV = Math.max(...values) + 3;
  const plotH = H - PAD_Y * 2;
  const plotW = W - PAD_X * 2;

  function xAt(i: number): number {
    return PAD_X + (i / (data.length - 1)) * plotW;
  }
  function yAt(v: number): number {
    return PAD_Y + ((maxV - v) / (maxV - minV)) * plotH;
  }

  const linePts = data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.value).toFixed(1)}`).join(" ");
  const fillPts =
    `${xAt(0).toFixed(1)},${(H - PAD_Y).toFixed(1)} ` +
    data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.value).toFixed(1)}`).join(" ") +
    ` ${xAt(data.length - 1).toFixed(1)},${(H - PAD_Y).toFixed(1)}`;

  // Show every 4th label (plus last)
  const labelIndices = data.reduce<number[]>((acc, _, i) => {
    if (i % 4 === 0 || i === data.length - 1) acc.push(i);
    return acc;
  }, []);

  return (
    <div style={{ width: "100%", height: 160, position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 160, display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rr-pg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4D8B6F" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#4D8B6F" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <polygon points={fillPts} fill="url(#rr-pg-fill)" />
        {/* Line */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#4D8B6F"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(d.value)} r="2.5" fill="#4D8B6F" />
        ))}
        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 2}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="middle"
          >
            {data[i].month}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PriceGuide({
  buildingName,
  district,
  region,
  buildingId,
  landlordId,
}: PriceGuideProps) {
  const [activeSize, setActiveSize] = useState<FlatSize>("1bed");
  const barRef = useRef<HTMLDivElement>(null);
  const barsInView = useInView(barRef as React.RefObject<Element>, { once: true, margin: "-40px" });

  const psf = DISTRICT_RENT_PSF[district] ?? 32;
  const compDistricts = COMPARISON_DISTRICTS[region].filter((d) => d !== district);
  const allDistricts = [district, ...compDistricts];
  const maxPsf = Math.max(...allDistricts.map((d) => DISTRICT_RENT_PSF[d] ?? 0));
  const sizeData = SIZE_RANGES[activeSize];

  const reviewHref = buildingId
    ? `/review?building=${buildingId}`
    : landlordId
    ? `/review?landlord=${landlordId}`
    : "/review";

  return (
    <div className="flex flex-col gap-4">

      {/* ── A: Header ── */}
      <div>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-2"
          style={{ background: "#E4F0EB", color: "#1F5C42" }}
        >
          <ShieldCheck size={12} />
          Price guide · Free · Govt data
        </div>
        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
          Data: {TREND_SUMMARY.source} · Updated {TREND_SUMMARY.dataMonth}
        </p>
      </div>

      {/* ── B: Three metric cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {([
          {
            label: "Similar buildings nearby",
            value: `HKD ${psf}/sqft`,
            sub: `per month · ${district}`,
            green: false,
          },
          {
            label: `${REGION_LABEL[region]} rental trend`,
            value: TREND_SUMMARY.twelveMonth,
            sub: "year on year",
            green: true,
          },
          {
            label: "Typical gross yield",
            value: "4.1%",
            sub: `${REGION_LABEL[region]} average`,
            green: false,
          },
        ] as { label: string; value: string; sub: string; green: boolean }[]).map(({ label, value, sub, green }) => (
          <div
            key={label}
            className="rounded-[12px] p-3.5 bg-white flex flex-col gap-1.5"
            style={{ border: "1px solid #E2D9CE" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider leading-snug"
              style={{ color: "#9CA3AF" }}
            >
              {label}
            </p>
            <p
              className="text-lg font-extrabold leading-none"
              style={{ color: green ? "#1F5C42" : "#555555" }}
            >
              {value}
            </p>
            <p className="text-[11px]" style={{ color: green ? "#4D8B6F" : "#9CA3AF" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── C: Rent by flat size ── */}
      <div className="rounded-[12px] p-5 bg-white" style={{ border: "1px solid #E2D9CE" }}>
        <h3 className="font-bold text-[15px] mb-4" style={{ color: "#555555" }}>
          Typical monthly rent
        </h3>
        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["studio", "1bed", "2bed", "3bed"] as FlatSize[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSize(s)}
              className="text-xs font-semibold px-3.5 py-2 rounded-full transition-all duration-150"
              style={
                activeSize === s
                  ? { background: "#555555", color: "#fff" }
                  : { background: "#F5F0E8", color: "#6B7280", border: "1px solid #E2D9CE" }
              }
            >
              {SIZE_LABELS[s]}
            </button>
          ))}
        </div>
        {/* Range display */}
        <div>
          <p className="text-2xl font-extrabold mb-1.5" style={{ color: "#555555" }}>
            HKD {sizeData.lo.toLocaleString()}
            <span className="text-xl font-bold" style={{ color: "#9CA3AF" }}> – </span>
            HKD {sizeData.hi.toLocaleString()}
            <span className="text-sm font-normal ml-1.5" style={{ color: "#9CA3AF" }}>
              / month
            </span>
          </p>
          <p className="text-xs mb-2" style={{ color: "#6B7280" }}>
            {sizeData.sqft} · HKD {sizeData.rate}/sqft per month
          </p>
          <p className="text-xs font-medium" style={{ color: "#4D8B6F" }}>
            {sizeData.note}
          </p>
        </div>
      </div>

      {/* ── D: Area comparison ── */}
      <div className="rounded-[12px] p-5 bg-white" style={{ border: "1px solid #E2D9CE" }}>
        <h3 className="font-bold text-[15px] mb-4" style={{ color: "#555555" }}>
          How {district} compares nearby
        </h3>
        <div ref={barRef} className="flex flex-col gap-3.5">
          {allDistricts.map((d) => {
            const dpf = DISTRICT_RENT_PSF[d] ?? psf;
            const isCurrent = d === district;
            const pct = maxPsf > 0 ? (dpf / maxPsf) * 100 : 0;
            const diff = psf > 0 ? Math.round(((dpf - psf) / psf) * 100) : 0;

            let badge: React.ReactNode;
            if (isCurrent) {
              badge = (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#F5F0E8", color: "#6B7280" }}
                >
                  this area
                </span>
              );
            } else if (diff < 0) {
              badge = (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  {diff}%
                </span>
              );
            } else {
              badge = (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#FDE8E3", color: "#A83820" }}
                >
                  +{diff}%
                </span>
              );
            }

            return (
              <div key={d} className="flex items-center gap-2.5">
                <span
                  className="text-xs w-28 shrink-0 truncate"
                  style={{
                    color: isCurrent ? "#555555" : "#6B7280",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {d}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F5F0E8" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isCurrent ? "#4D8B6F" : "#B0D4C3" }}
                    initial={{ width: 0 }}
                    animate={barsInView ? { width: `${pct}%` } : { width: 0 }}
                    transition={{ duration: 0.85, delay: 0.05 * allDistricts.indexOf(d), ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span
                  className="text-xs font-bold shrink-0 w-[72px] text-right"
                  style={{ color: "#555555" }}
                >
                  HKD {dpf}/sqft
                </span>
                <div className="w-14 flex justify-end shrink-0">{badge}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── E: Trend chart ── */}
      <div className="rounded-[12px] p-5 bg-white" style={{ border: "1px solid #E2D9CE" }}>
        <h3 className="font-bold text-[15px] mb-4" style={{ color: "#555555" }}>
          Rental trend — {REGION_LABEL[region]}, similar buildings
        </h3>
        <TrendChart />
        <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
          RVD rental index · Jan 2023 – Mar 2026
        </p>
      </div>

      {/* ── F: Trend summary table ── */}
      <div className="rounded-[12px] p-5 bg-white" style={{ border: "1px solid #E2D9CE" }}>
        <h3 className="font-bold text-[15px] mb-3" style={{ color: "#555555" }}>
          Rental trend summary
        </h3>
        <div className="flex flex-col">
          {(
            [
              { label: "Last 3 months", value: TREND_SUMMARY.threeMonth, positive: true },
              { label: "Last 6 months", value: TREND_SUMMARY.sixMonth, positive: true },
              { label: "Last 12 months", value: TREND_SUMMARY.twelveMonth, positive: true },
              { label: "Since 2020 low", value: TREND_SUMMARY.since2020Low, positive: true },
              { label: "vs 2019 peak", value: TREND_SUMMARY.vsPeak2019, positive: false },
            ] as { label: string; value: string; positive: boolean }[]
          ).map(({ label, value, positive }, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between py-3"
              style={i < arr.length - 1 ? { borderBottom: "1px solid #F5F0E8" } : {}}
            >
              <span className="text-sm" style={{ color: "#6B7280" }}>
                {label}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: positive ? "#1F5C42" : "#A83820" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── G: Insight callout ── */}
      <div
        className="rounded-[12px] p-5"
        style={{ background: "#E4F0EB", border: "1px solid #B0D4C3" }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#1F5C42" }}>
          Rents in <strong>{district}</strong> ({REGION_LABEL[region]}) are up{" "}
          <strong>{TREND_SUMMARY.twelveMonth}</strong> year on year, and are{" "}
          <strong>{TREND_SUMMARY.vsPeak2019}</strong> below the 2019 market peak. If
          you&apos;re being quoted above the ranges above, there may be room to
          negotiate — especially on listings that have been available for 30+ days.
        </p>
      </div>

      {/* ── H: Review CTA banner ── */}
      <div className="rounded-[12px] p-5" style={{ background: "#555555" }}>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "#9FE1CB" }}
        >
          Help future tenants
        </p>
        <h3 className="text-lg font-extrabold text-white mb-2">
          {buildingId ? `Rented at ${buildingName}?` : "Rented from this landlord?"}
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.70)" }}>
          The price data above comes from the government. What&apos;s missing is your
          experience — what you actually paid, how the landlord behaved, and whether
          it was worth it.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link
            href={reviewHref}
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
            style={{ background: "#fff", color: "#555555" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#F5F0E8")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#fff")
            }
          >
            <PenLine size={14} />
            Write a review
          </Link>
          <span
            className="text-xs font-semibold px-4 py-2.5 rounded-full"
            style={{
              border: "1px solid rgba(159,225,203,0.45)",
              color: "#9FE1CB",
            }}
          >
            Free · Anonymous · 4 minutes
          </span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {[
            "Your review is verified and anonymous",
            "Helps the next tenant make a better decision",
            "Good landlords get recognition they deserve",
          ].map((text) => (
            <li
              key={text}
              className="text-xs flex items-center gap-2"
              style={{ color: "#9FE1CB" }}
            >
              <span className="w-1 h-1 rounded-full flex-shrink-0 bg-current" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
