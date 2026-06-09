"use client";

// Write a Review links to /review?building=[id] — verified April 2026
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Star,
  ChevronRight,
  ChevronDown,
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
  User,
} from "lucide-react";
import Link from "next/link";
import { Building, Landlord, Review } from "@/lib/data/types";
// ReviewResponse is on the Review type via review.response
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

function shortenBuildingType(t: string): string {
  if (t === "Residential/Composite") return "Residential";
  if (t === "Non-domestic") return "Commercial";
  if (t === "Composite") return "Mixed Use";
  return t;
}

function toRegion(r: "Kowloon" | "HK Island" | "New Territories"): PriceGuideRegion {
  if (r === "Kowloon") return "kowloon";
  if (r === "HK Island") return "hk_island";
  return "new_territories";
}

function regionSlug(r: string): string {
  if (r === "HK Island") return "hk-island";
  if (r === "New Territories") return "new-territories";
  return r.toLowerCase();
}

const REVIEW_FILTERS = ["All", "Positive", "Critical"] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

function filterReviews(list: Review[], filter: ReviewFilter): Review[] {
  switch (filter) {
    case "Positive":
      return list.filter((r) => r.rating >= 4);
    case "Critical":
      return list.filter((r) => r.rating <= 2);
    default:
      return list;
  }
}

type ReviewSection = "building" | "landlord";

function formatUnitLabel(review: Review): string | null {
  const parts = [
    review.unitType === "studio"
      ? "Studio"
      : review.unitType === "1bed"
        ? "1 bed"
        : review.unitType === "2bed"
          ? "2 bed"
          : review.unitType === "3bed"
            ? "3 bed"
            : review.unitType === "4bed+"
              ? "4 bed+"
              : review.unitType,
    review.floorNumber,
    review.unitNumber ? `Unit ${review.unitNumber}` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function resolveLandlordForReview(
  review: Review,
  linkedLandlords: Landlord[]
): { id?: string; name: string } | null {
  if (review.landlordId) {
    const linked = linkedLandlords.find((l) => l.id === review.landlordId);
    return {
      id: review.landlordId,
      name: linked?.name ?? review.landlordName ?? "Landlord",
    };
  }
  if (review.landlordName) {
    return { name: review.landlordName };
  }
  return null;
}

function buildingScores(review: Review) {
  return [
    { label: "Maintenance", score: review.dimensions.maintenance },
    { label: "Cleanliness", score: review.dimensions.cleanliness },
    { label: "Pest control", score: review.dimensions.pestControl },
    { label: "Noise", score: review.dimensions.noise },
    { label: "Facilities", score: review.dimensions.facilities },
    { label: "Building management", score: review.dimensions.buildingMgmt },
  ].filter((s) => s.score > 0);
}

function landlordScores(review: Review) {
  return [
    { label: "Deposit", score: review.dimensions.depositReturn },
    { label: "Listing accuracy", score: review.dimensions.listingAccuracy },
    { label: "Responsive", score: review.dimensions.landlordResponsiveness },
    { label: "Flat repairs", score: review.dimensions.flatRepairs },
    { label: "Rent again", score: review.dimensions.wouldRentAgain },
  ].filter((s) => s.score > 0);
}

function CorrectionForm({ buildingId, buildingName }: { buildingId: string; buildingName: string }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitCorrection() {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError("Please add at least 10 characters so we can review properly.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/buildings/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId,
          buildingName,
          message: trimmed,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setIsSent(true);
      setMessage("");
    } catch {
      setError("Could not send correction right now. Please email joe@rentradar.co directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <p className="text-xs font-semibold" style={{ color: "#4D8B6F" }}>
        Thanks, your correction was sent to joe@rentradar.co.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue with this building data..."
        className="w-full text-xs rounded-[10px] p-3 outline-none resize-y min-h-[90px]"
        style={{ border: "1px solid #E2D9CE", color: "#555555", background: "#F5F0E8" }}
      />
      <button
        onClick={handleSubmitCorrection}
        disabled={isSubmitting}
        className="self-start text-xs font-semibold px-4 py-2 rounded-[10px] transition-colors"
        style={{ background: "#4D8B6F", color: "#fff", opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? "Sending..." : "Submit correction"}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "#A83820" }}>
          {error}
        </p>
      )}
    </div>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

interface BuildingProfileProps {
  building: Building;
  reviews?: Review[];
  linkedLandlords?: Landlord[];
}

export default function BuildingProfile({
  building,
  reviews: propReviews,
  linkedLandlords: propLandlords,
}: BuildingProfileProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("All");
  const [reviewSection, setReviewSection] = useState<Record<string, ReviewSection>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "price-guide">("overview");
  const [showOfficialRecords, setShowOfficialRecords] = useState(false);

  const buildingReviews = propReviews ?? [];
  const visibleReviews = filterReviews(buildingReviews, activeFilter);
  const linkedLandlords = propLandlords ?? [];
  const reviewCount = buildingReviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (buildingReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10
        ) / 10
      : null;

  const permitYear = new Date(building.occupationPermitDate).getFullYear();
  const hasOutstandingOrders = building.statutoryOrders.some(
    (o) => o.status === "Outstanding"
  );

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
          <span className="flex items-center gap-1">
            <Link href="/search" className="inline-flex items-center min-h-9 px-1 text-[#4D8B6F] hover:underline transition-colors">
              {building.market}
            </Link>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </span>
          <span className="flex items-center gap-1">
            <Link href={`/search?region=${regionSlug(building.region)}`} className="inline-flex items-center min-h-9 px-1 text-[#4D8B6F] hover:underline transition-colors">
              {building.region}
            </Link>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </span>
          <span className="flex items-center gap-1">
            <Link href={`/search?district=${encodeURIComponent(building.district)}`} className="inline-flex items-center min-h-9 px-1 text-[#4D8B6F] hover:underline transition-colors">
              {building.district}
            </Link>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </span>
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


              <h1 className="text-3xl sm:text-[36px] font-extrabold text-[#555555] tracking-tight leading-tight mb-2 pr-10">
                {building.name}
              </h1>
              <p className="text-sm text-[#6B7280] mb-5 flex items-start gap-1.5">
                <MapPin size={13} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                {building.address}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-x-5 sm:gap-y-2 text-sm text-[#6B7280] mb-5 pb-5" style={{ borderBottom: "1px solid #F5F0E8" }}>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#9CA3AF]" />
                  Built {permitYear}
                </span>
                {building.floors > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-[#9CA3AF]" />
                    {building.floors} floors
                  </span>
                )}
                {building.units > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#9CA3AF]" />
                    {building.units} units
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Hash size={13} className="text-[#9CA3AF]" />
                  {building.buildingType}
                </span>
              </div>

              {/* Rating + badges */}
              <div className="flex items-center gap-5 mb-4">
                <span className="font-extrabold leading-none" style={{ fontSize: "52px", color: "#555555" }}>
                  {averageRating ?? "—"}
                </span>
                <div>
                  {averageRating !== null ? (
                    <StarRating stars={Math.round(averageRating)} size={22} />
                  ) : (
                    <p className="text-sm font-semibold text-[#6B7280]">Yet to be reviewed</p>
                  )}
                  <p className="text-sm text-[#6B7280] mt-1">
                    Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  <MapPin size={11} />
                  {building.district}
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

            {/* ── AI Description ── */}
            <motion.div {...cardFade(0.02)}>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#9CA3AF",
                  marginBottom: "12px",
                }}>
                  About this building
                </p>
                <div style={{
                  fontSize: "15px",
                  color: "#6B7280",
                  lineHeight: "1.7",
                  whiteSpace: "pre-line",
                }}>
                  {building.description || "Detailed building profile coming soon."}
                </div>
              </div>
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
                id="linked-landlords"
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

            {/* ── Building Scores ── */}
            {buildingReviews.length > 0 && (() => {
              function avg(fn: (r: Review) => number): number {
                const vals = buildingReviews.map(fn).filter((v) => v > 0);
                if (!vals.length) return 0;
                return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
              }
              const bScores = [
                { label: "Maintenance & repairs",  score: avg((r) => r.dimensions.maintenance) },
                { label: "Cleanliness",            score: avg((r) => r.dimensions.cleanliness) },
                { label: "Pest control",           score: avg((r) => r.dimensions.pestControl) },
                { label: "Noise levels",           score: avg((r) => r.dimensions.noise) },
                { label: "Facilities",             score: avg((r) => r.dimensions.facilities) },
                { label: "Building management",    score: avg((r) => r.dimensions.buildingMgmt) },
              ].filter((s) => s.score > 0);
              if (!bScores.length) return null;
              return (
                <motion.div
                  {...cardFade(0.05)}
                  className="bg-white rounded-[16px] p-8"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                >
                  <h2 className="text-lg font-bold text-[#555555] mb-6">Building scores</h2>
                  <div className="flex flex-col gap-4">
                    {bScores.map(({ label, score }) => (
                      <div key={label} className="flex items-center gap-4">
                        <span className="text-sm text-[#6B7280] flex-1 min-w-0">{label}</span>
                        <StarRating stars={Math.round(score)} size={14} />
                        <span className="text-sm font-bold w-8 text-right shrink-0" style={{ color: "#555555" }}>
                          {score}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

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
                <span className="text-sm text-[#6B7280]">({reviewCount})</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {REVIEW_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all duration-150"
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
                    {buildingReviews.length === 0
                      ? "No reviews yet — be the first to review this building"
                      : "No reviews match this filter."}
                  </p>
                )}
                {visibleReviews.slice(0, 1).map((review, i) => {
                  const section = reviewSection[review.id] ?? "building";
                  const expandKey = `${review.id}-${section}`;
                  const landlord = resolveLandlordForReview(review, linkedLandlords);
                  const scores =
                    section === "building" ? buildingScores(review) : landlordScores(review);

                  return (
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
                      {formatUnitLabel(review) && (
                        <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                          {formatUnitLabel(review)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mb-4">
                      {(["building", "landlord"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() =>
                            setReviewSection((prev) => ({ ...prev, [review.id]: tab }))
                          }
                          className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all duration-150"
                          style={
                            section === tab
                              ? { background: "#555555", color: "#fff" }
                              : { background: "#F5F0E8", color: "#6B7280", border: "1px solid #E2D9CE" }
                          }
                        >
                          {tab === "building" ? "Building review" : "Landlord review"}
                        </button>
                      ))}
                    </div>

                    {section === "landlord" && landlord && (
                      <div
                        className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl"
                        style={{ background: "#F5F0E8" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={14} style={{ color: "#9CA3AF" }} className="shrink-0" />
                          <span className="text-sm font-semibold truncate" style={{ color: "#555555" }}>
                            {landlord.name}
                          </span>
                        </div>
                        {landlord.id && (
                          <Link
                            href={`/landlord/${landlord.id}`}
                            className="text-xs font-semibold shrink-0 inline-flex items-center gap-1 transition-colors hover:underline"
                            style={{ color: "#4D8B6F" }}
                          >
                            View profile
                            <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                    )}

                    <div
                      className="mb-1"
                      style={
                        !expanded.has(expandKey)
                          ? { maxHeight: "5.5rem", overflow: "hidden" }
                          : {}
                      }
                    >
                      {section === "building" ? (
                        review.buildingDayToDay || review.buildingIssues ? (
                          <>
                            {review.buildingDayToDay && (
                              <div className="mb-3">
                                <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>
                                  What was the building like day-to-day?
                                </p>
                                <p className="text-sm text-[#6B7280] leading-relaxed">{review.buildingDayToDay}</p>
                              </div>
                            )}
                            {review.buildingIssues && (
                              <div>
                                <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>
                                  Building issues
                                </p>
                                <p className="text-sm text-[#6B7280] leading-relaxed">{review.buildingIssues}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-[#6B7280] leading-relaxed">{review.body}</p>
                        )
                      ) : review.landlordExperience || review.landlordDeposit || review.landlordRentAgain ? (
                        <>
                          {review.landlordExperience && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>
                                How was the landlord to deal with?
                              </p>
                              <p className="text-sm text-[#6B7280] leading-relaxed">{review.landlordExperience}</p>
                            </div>
                          )}
                          {review.landlordDeposit && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>
                                How was the deposit handled?
                              </p>
                              <p className="text-sm text-[#6B7280] leading-relaxed">{review.landlordDeposit}</p>
                            </div>
                          )}
                          {review.landlordRentAgain && (
                            <div>
                              <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>
                                Would you rent from this landlord again?
                              </p>
                              <p className="text-sm text-[#6B7280] leading-relaxed">{review.landlordRentAgain}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-[#6B7280] leading-relaxed">
                          No landlord feedback in this review.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpand(expandKey)}
                      className="text-xs font-semibold mb-4 transition-colors"
                      style={{ color: "#4D8B6F" }}
                    >
                      {expanded.has(expandKey) ? "Show less" : "Read more"}
                    </button>

                    {scores.length > 0 && (
                      <div
                        className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 pt-3"
                        style={{ borderTop: "1px solid #F5F0E8" }}
                      >
                        {scores.map(({ label, score }) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{label}</span>
                            <div className="flex items-center gap-1">
                              <StarRating stars={Math.round(score)} size={10} />
                              <span className="text-[11px] font-semibold" style={{ color: "#555555" }}>{score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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
                          {formatDate(review.datePosted)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: "#9CA3AF" }}>
                        <span className="text-[11px]">Helpful?</span>
                        <button
                          aria-label="Helpful"
                          className="p-2 rounded transition-colors hover:text-[#555555]"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          aria-label="Not helpful"
                          className="p-2 rounded transition-colors hover:text-red-400"
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Landlord response — shown on landlord tab */}
                    {section === "landlord" && review.response?.status === "approved" && (
                      <div
                        className="mt-4 pl-4 py-3 pr-3 rounded-r-[10px]"
                        style={{ borderLeft: "3px solid #4D8B6F", background: "#F5F0E8" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: "#4D8B6F" }}>
                            Response from landlord
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#E4F0EB", color: "#1F5C42" }}
                          >
                            <Shield size={9} />
                            Verified
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                          {review.response.responseText}
                        </p>
                        <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                          {formatDate(review.response.createdAt)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                  );
                })}

                {/* Subscription gate */}
                {reviewCount > 1 && (
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
                      Read all {reviewCount} reviews
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

              {reviewCount > 3 && (
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
                  { label: "Reviews", value: `${reviewCount}` },
                  { label: "Rating", value: averageRating !== null ? `${averageRating} / 5` : "Yet to be reviewed" },
                  { label: "Built", value: `${permitYear}` },
                  building.units > 0
                    ? { label: "Units", value: `${building.units}` }
                    : { label: "Type", value: shortenBuildingType(building.buildingType || "—") },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: "#F5F0E8" }}>
                    <p className="font-extrabold" style={{ color: "#555555", fontSize: "clamp(12px, 1.8vw, 20px)", wordBreak: "break-word", lineHeight: 1.2 }}>
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
              {linkedLandlords.length > 0 && (
                <Link
                  href={`#linked-landlords`}
                  className="w-full text-sm font-medium flex items-center justify-center gap-1.5 py-2 transition-colors"
                  style={{ color: "#4D8B6F" }}
                >
                  View Landlords in this Building
                </Link>
              )}
            </motion.div>

            {/* Official Records — collapsible */}
            <motion.div
              {...cardFade(0.13)}
              className="bg-white rounded-[16px] p-6"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <button
                onClick={() => setShowOfficialRecords((v) => !v)}
                className="w-full flex items-center justify-between min-h-11"
              >
                <span className="text-sm font-semibold" style={{ color: "#555555" }}>
                  Official Records
                </span>
                <ChevronDown
                  size={15}
                  style={{
                    color: "#9CA3AF",
                    transform: showOfficialRecords ? "rotate(180deg)" : "none",
                    transition: "transform 150ms",
                  }}
                />
              </button>
              {showOfficialRecords && (
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: "Occupation Permit", value: building.occupationPermitNumber },
                    { label: "Permit Issued", value: formatDate(building.occupationPermitDate) },
                    { label: "Building Type", value: building.buildingType },
                    { label: "Block ID", value: building.blockId },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{label}</span>
                      <span style={{ fontSize: "13px", color: "#555555", fontWeight: 500, textAlign: "left" }} className="sm:text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                    Data sourced from Buildings Department, HKSAR
                  </p>
                </div>
              )}
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
              <CorrectionForm buildingId={building.id} buildingName={building.name} />
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
