"use client";

// Write a Review links to /review?building=[id] — verified April 2026
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Star,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Share2,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Shield,
  Calendar,
  Layers,
  Hash,
  Lock,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { Building, Landlord, Review } from "@/lib/data/types";
import { getLandlordById } from "@/lib/data/landlords";
import { getReviewsByBuildingId } from "@/lib/data/reviews";
// Pre-fetched props from the server page (Supabase) take priority over mock data
import { fetchBuildingData, GovBuildingData } from "@/lib/govdata/hkBuildings";
import GovDataBadge from "./GovDataBadge";
import PriceGuide, { PriceGuideRegion } from "./PriceGuide";

// ── Helpers ───────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function cardFade(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" } as const,
    transition: { duration: 0.5, ease: EASE, delay },
  };
}

function StarRating({ stars, size = 15 }: { stars: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= stars ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#D8D8D8] fill-[#D8D8D8]"
          }
        />
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-HK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Outstanding: { bg: "#FDE8E3", text: "#A83820" },
  "In Progress": { bg: "#FDE8E3", text: "#A83820" },
  Complied: { bg: "#E4F0EB", text: "#4D8B6F" },
};

function toRegion(r: "Kowloon" | "HK Island" | "New Territories"): PriceGuideRegion {
  if (r === "Kowloon") return "kowloon";
  if (r === "HK Island") return "hk_island";
  return "new_territories";
}

const REVIEW_FILTERS = ["All", "By Flat", "Positive", "Critical"] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

function filterReviews(list: Review[], filter: ReviewFilter): Review[] {
  switch (filter) {
    case "Positive":
      return list.filter((r) => r.rating >= 4);
    case "Critical":
      return list.filter((r) => r.rating <= 2);
    case "By Flat":
      return [...list].sort((a, b) => a.flatRef.localeCompare(b.flatRef));
    default:
      return list;
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className ?? ""}`}
      style={{ background: "#E2D9CE" }}
    />
  );
}

function GovDataSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#E4F0EB" }}>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface BuildingProfileProps {
  building: Building;
  /** Pre-fetched reviews from Supabase (falls back to mock data if omitted) */
  reviews?: Review[];
  /** Pre-fetched landlords from Supabase (falls back to mock data if omitted) */
  linkedLandlords?: Landlord[];
}

export default function BuildingProfile({
  building,
  reviews: propReviews,
  linkedLandlords: propLandlords,
}: BuildingProfileProps) {
  const [govData, setGovData] = useState<GovBuildingData | null>(null);
  const [govLoading, setGovLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "price-guide">("overview");

  // Use Supabase data when provided; fall back to local mock data
  const buildingReviews = propReviews ?? getReviewsByBuildingId(building.id);
  const visibleReviews = filterReviews(buildingReviews, activeFilter);

  const linkedLandlords =
    propLandlords ??
    building.landlords
      .map((id) => getLandlordById(id))
      .filter((l): l is Landlord => l !== undefined);

  const permitYear = new Date(building.occupationPermitDate).getFullYear();
  const hasOutstandingOrders = building.statutoryOrders.some(
    (o) => o.status === "Outstanding"
  );

  useEffect(() => {
    fetchBuildingData(building.address).then((data) => {
      setGovData(data);
      setGovLoading(false);
    });
  }, [building.address]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-24">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[#6B7280] mb-8 flex-wrap">
          {[building.market, building.region, building.district].map((crumb) => (
            <span key={crumb} className="flex items-center gap-1">
              <a href="#" className="text-[#4D8B6F] hover:underline transition-colors">
                {crumb}
              </a>
              <ChevronRight size={12} className="text-[#9CA3AF]" />
            </span>
          ))}
          <span className="font-medium text-[#555555]">{building.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div className="w-full lg:w-[65%] flex flex-col gap-7">

            {/* ── Profile Header ── */}
            <motion.div
              {...cardFade(0)}
              className="bg-white rounded-[16px] p-8 relative"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <button
                aria-label="Share"
                className="absolute top-6 right-6 p-2.5 rounded-full transition-colors"
                style={{ background: "#F5F0E8" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE8E3")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F0E8")}
              >
                <Share2 size={16} className="text-[#6B7280]" />
              </button>

              {/* Photo placeholder */}
              <div
                className="w-full h-44 rounded-xl flex items-center justify-center mb-6"
                style={{ background: "#EDE8E3" }}
              >
                <Building2 size={48} style={{ color: "#9CA3AF" }} />
              </div>

              <h1 className="text-3xl sm:text-[36px] font-extrabold text-[#555555] tracking-tight leading-tight mb-2 pr-10">
                {building.name}
              </h1>
              <p className="text-sm text-[#6B7280] mb-5 flex items-start gap-1.5">
                <MapPin size={13} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                {building.address}
              </p>

              {/* Stats row */}
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6B7280] mb-5 pb-5"
                style={{ borderBottom: "1px solid #F5F0E8" }}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#9CA3AF]" />
                  Built {permitYear}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers size={13} className="text-[#9CA3AF]" />
                  {building.floors} floors
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#9CA3AF]" />
                  {building.units} units
                </span>
                <span className="flex items-center gap-1.5">
                  <Hash size={13} className="text-[#9CA3AF]" />
                  {building.buildingType}
                </span>
              </div>

              {/* Rating + badges */}
              <div className="flex items-center gap-5 mb-4">
                <span className="font-extrabold leading-none" style={{ fontSize: "52px", color: "#555555" }}>
                  {building.avgRating}
                </span>
                <div>
                  <StarRating stars={Math.round(building.avgRating)} size={22} />
                  <p className="text-sm text-[#6B7280] mt-1">
                    Based on {building.totalReviews} reviews
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  <MapPin size={11} />
                  {building.market}
                </span>
                <GovDataBadge lastUpdated={building.govDataLastUpdated} />
                {hasOutstandingOrders && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "#FDE8E3", color: "#A83820" }}
                  >
                    <AlertTriangle size={11} />
                    Government Orders on Record
                  </span>
                )}
              </div>
            </motion.div>

            {/* ── Tab Bar ── */}
            <div className="flex gap-1 p-1 rounded-[12px]" style={{ background: "#F5F0E8" }}>
              {(["overview", "price-guide"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-[10px] transition-all duration-150"
                  style={
                    activeTab === tab
                      ? { background: "#fff", color: "#555555", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
                      : { background: "transparent", color: "#6B7280" }
                  }
                >
                  {tab === "overview" ? "Overview" : "Price Guide"}
                </button>
              ))}
            </div>

            {/* ── Price Guide tab ── */}
            {activeTab === "price-guide" && (
              <PriceGuide
                buildingName={building.name}
                district={building.district}
                region={toRegion(building.region)}
                buildingId={building.id}
              />
            )}

            {activeTab === "overview" && (<>

            {/* ── Government Data Card ── */}
            <motion.div
              {...cardFade(0.05)}
              className="rounded-[16px] p-8"
              style={{
                background: "#E4F0EB",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                borderLeft: "4px solid #555555",
              }}
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="text-lg font-bold text-[#555555]">Official Building Record</h2>
                <span className="text-xs font-medium" style={{ color: "#4D8B6F" }}>
                  ✓ Data sourced from Buildings Department, HKSAR
                </span>
              </div>

              {govLoading ? (
                <GovDataSkeleton />
              ) : govData ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Occupation Permit", value: govData.occupationPermitNumber },
                    { label: "Permit Issued", value: formatDate(govData.occupationPermitDate) },
                    { label: "Building Type", value: `${govData.buildingType} · ${govData.buildingUsage}` },
                    { label: "Block ID", value: govData.blockId },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ background: "#fff" }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                        {label}
                      </p>
                      <p className="text-sm font-bold text-[#555555]">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">Government data unavailable for this address.</p>
              )}
            </motion.div>

            {/* ── Statutory Orders Card ── */}
            <motion.div
              {...cardFade(0.05)}
              className="rounded-[16px] p-8"
              style={{
                background: hasOutstandingOrders ? "#FDE8E3" : "#fff",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                borderLeft: `4px solid ${hasOutstandingOrders ? "#E8573A" : "#4D8B6F"}`,
              }}
            >
              {building.statutoryOrders.length > 0 ? (
                <>
                  <h2 className="text-lg font-bold text-[#555555] mb-5 flex items-center gap-2.5">
                    <AlertTriangle size={18} style={{ color: "#E8573A" }} />
                    Government Orders on Record
                  </h2>
                  <div className="flex flex-col gap-4 mb-4">
                    {building.statutoryOrders.map((order) => {
                      const style = STATUS_STYLE[order.status];
                      return (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl"
                          style={{ background: "#fff" }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: style.bg, color: style.text }}
                              >
                                {order.type}
                              </span>
                              <span className="text-[11px] text-[#9CA3AF]">{order.section}</span>
                            </div>
                            <p className="text-sm text-[#6B7280]">{order.description}</p>
                            <p className="text-xs text-[#9CA3AF] mt-1">
                              Issued: {formatDate(order.issuedDate)}
                            </p>
                          </div>
                          <span
                            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-center"
                            style={{ background: style.bg, color: style.text }}
                          >
                            {order.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    Source: Buildings Department, HKSAR. Data updated monthly.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-[#555555] mb-3 flex items-center gap-2.5">
                    <CheckCircle2 size={18} style={{ color: "#4D8B6F" }} />
                    Clean Government Record
                  </h2>
                  <p className="text-sm text-[#6B7280] mb-3">
                    No statutory orders on record for this building.
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    Source: Buildings Department, HKSAR. Data updated monthly.
                  </p>
                </>
              )}
            </motion.div>

            {/* ── Landlords in this Building ── */}
            {linkedLandlords.length > 0 && (
              <motion.div
                {...cardFade(0.05)}
                className="bg-white rounded-[16px] p-8"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              >
                <h2 className="text-lg font-bold text-[#555555] mb-5">
                  Landlords in this building
                </h2>
                <div className="flex flex-col gap-3">
                  {linkedLandlords.map((l) => (
                    <Link
                      key={l.id}
                      href={`/landlord/${l.id}`}
                      className="flex items-center justify-between p-4 rounded-xl transition-colors group"
                      style={{ background: "#F5F0E8" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#EDE8E3")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F5F0E8")
                      }
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-[#555555]">{l.name}</p>
                          {l.verified && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "#E4F0EB", color: "#1F5C42" }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating stars={Math.round(l.avgRating)} size={12} />
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>
                            {l.avgRating} · {l.totalReviews} reviews
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "#4D8B6F" }}
                      />
                    </Link>
                  ))}
                </div>
                <p className="text-xs mt-4" style={{ color: "#9CA3AF" }}>
                  Know a landlord in this building not listed?{" "}
                  <a href="#" className="text-[#4D8B6F] hover:underline font-medium">
                    Add them →
                  </a>
                </p>
              </motion.div>
            )}

            {/* ── Write a Review Banner ── */}
            <div
              className="rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: "#555555" }}
            >
              <div>
                <p className="text-white font-bold text-lg leading-snug">
                  Lived or rented at {building.name}?
                </p>
                <p className="text-sm mt-1" style={{ color: "#D1D5DB" }}>
                  Share your experience and help future tenants make a better decision.
                </p>
              </div>
              <Link
                href={`/review?building=${building.id}`}
                className="shrink-0 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-[12px] transition-colors text-white"
                style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
              >
                <PenLine size={15} />
                Write a Review
              </Link>
            </div>

            {/* ── Reviews ── */}
            <motion.div {...cardFade(0.05)}>
              <div className="flex items-baseline gap-2 mb-5">
                <h2 className="text-xl font-bold text-[#555555]">
                  Tenant reviews for this building
                </h2>
                <span className="text-sm text-[#6B7280]">({building.totalReviews})</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {REVIEW_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="text-xs font-semibold px-4 py-2 rounded-full transition-all duration-150"
                    style={
                      activeFilter === f
                        ? { background: "#555555", color: "#fff" }
                        : { background: "#fff", color: "#6B7280", border: "1px solid #E2D9CE" }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {visibleReviews.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>
                    No reviews match this filter.
                  </p>
                )}
                {visibleReviews.slice(0, 1).map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
                    className="bg-white rounded-[16px] p-6"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                  >
                    <div className="mb-3">
                      <StarRating stars={review.rating} size={14} />
                      <h3 className="font-bold text-[#555555] mt-2 text-[15px] leading-snug">
                        {review.headline}
                      </h3>
                    </div>

                    <p
                      className="text-sm text-[#6B7280] leading-relaxed mb-1"
                      style={
                        !expanded.has(review.id)
                          ? {
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }
                          : {}
                      }
                    >
                      {review.body}
                    </p>
                    <button
                      onClick={() => toggleExpand(review.id)}
                      className="text-xs font-semibold mb-4 transition-colors"
                      style={{ color: "#4D8B6F" }}
                    >
                      {expanded.has(review.id) ? "Show less" : "Read more"}
                    </button>

                    <div
                      className="flex items-center justify-between flex-wrap gap-3 pt-3"
                      style={{ borderTop: "1px solid #F5F0E8" }}
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: "#E4F0EB", color: "#1F5C42" }}
                        >
                          ✓ Verified Tenant
                        </span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>
                          {review.flatRef} · {review.district} · {formatDate(review.datePosted)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: "#9CA3AF" }}>
                        <span className="text-[11px]">Helpful?</span>
                        <button
                          aria-label="Helpful"
                          className="p-1 rounded transition-colors hover:text-[#555555]"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          aria-label="Not helpful"
                          className="p-1 rounded transition-colors hover:text-red-400"
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Subscription gate */}
                {buildingReviews.length > 1 && (
                  <div
                    className="rounded-[16px] p-8 text-center"
                    style={{ background: "#E4F0EB", border: "1px solid #4D8B6F" }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "#E4F0EB" }}
                    >
                      <Lock size={20} style={{ color: "#4D8B6F" }} />
                    </div>
                    <h3 className="font-bold text-[#555555] text-lg mb-2">
                      Read all {buildingReviews.length} reviews
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto leading-relaxed">
                      Subscribe to access every review for this building and every other property on RentRadar.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-[12px] text-white transition-colors"
                      style={{ background: "#4D8B6F" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#3A7059")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#4D8B6F")}
                    >
                      HKD 29/month — Get access
                    </Link>
                  </div>
                )}
              </div>

              {buildingReviews.length > 3 && (
                <div className="mt-7 flex justify-center">
                  <button
                    className="text-sm font-semibold px-8 py-3 rounded-[12px] transition-all duration-200"
                    style={{ border: "2px solid #555555", color: "#555555", background: "transparent" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#555555";
                      (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "#555555";
                    }}
                  >
                    Load more reviews
                  </button>
                </div>
              )}
            </motion.div>

            {/* ── Write a Review CTA ── */}
            <motion.div
              {...cardFade(0.05)}
              className="rounded-[16px] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              style={{ background: "#555555" }}
            >
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  Live or lived at {building.name}?
                </h3>
                <p className="text-sm" style={{ color: "#D1D5DB" }}>
                  Your review helps future tenants make an informed decision.
                </p>
              </div>
              <Link
                href={`/review?building=${building.id}`}
                className="shrink-0 font-bold text-sm px-7 py-3.5 rounded-[12px] transition-colors"
                style={{ background: "#fff", color: "#555555" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#F5F0E8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#fff")
                }
              >
                Write a Review
              </Link>
            </motion.div>

            </>)}

          </div>

          {/* ════════════ RIGHT SIDEBAR ════════════ */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6 lg:sticky lg:top-[100px]">

            {/* Quick Stats */}
            <motion.div
              {...cardFade(0.1)}
              className="bg-white rounded-[16px] p-6"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Reviews", value: `${building.totalReviews}` },
                  { label: "Rating", value: `${building.avgRating} / 5` },
                  { label: "Built", value: `${permitYear}` },
                  { label: "Units", value: `${building.units}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: "#F5F0E8" }}>
                    <p className="text-xl font-extrabold" style={{ color: "#555555" }}>
                      {value}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href={`/review?building=${building.id}`}
                className="w-full text-white font-semibold text-sm py-3.5 rounded-[12px] mb-3 transition-colors flex items-center justify-center"
                style={{ background: "#4D8B6F" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#3A7059")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#4D8B6F")
                }
              >
                Write a Review
              </Link>
              <Link
                href="/search"
                className="w-full text-sm font-medium flex items-center justify-center gap-1.5 py-2 transition-colors"
                style={{ color: "#4D8B6F" }}
              >
                View All Landlords
              </Link>
            </motion.div>

            {/* Gov Data Card */}
            <motion.div
              {...cardFade(0.15)}
              className="rounded-[16px] p-6"
              style={{
                background: "#E4F0EB",
                border: "1px solid #B0D4C3",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} style={{ color: "#4D8B6F" }} />
                <h3 className="font-bold text-[#555555] text-sm">Government Data</h3>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
                Building records for this property are sourced directly from the Buildings Department, HKSAR.
              </p>
              <GovDataBadge lastUpdated={building.govDataLastUpdated} />
            </motion.div>

            {/* Something wrong */}
            <motion.div
              {...cardFade(0.2)}
              className="bg-white rounded-[16px] p-6"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <h3 className="font-bold text-[#555555] text-sm mb-2">
                Something wrong with this data?
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
                Help us keep records accurate. Submit a correction and we&apos;ll review it within 48 hours.
              </p>
              <a
                href="#"
                className="text-xs font-semibold transition-colors"
                style={{ color: "#4D8B6F" }}
              >
                Submit a correction →
              </a>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
