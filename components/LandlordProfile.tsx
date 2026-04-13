"use client";

// Write a Review links to /review?landlord=[id] — verified April 2026
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Star,
  Share2,
  Lock,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Shield,
  MapPin,
  ArrowRight,
  Sparkles,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { Building, Landlord, Review } from "@/lib/data/types";
import GovDataBadge from "./GovDataBadge";
import PriceGuide, { PriceGuideRegion } from "./PriceGuide";

// ── Mock Data ───────────────────────────────────────────────────────────────

const landlord = {
  name: "Pacific Realty Holdings Ltd",
  address: "Flat 12B, Harbour View Tower, 18 Hoi Fai Road, Tai Kok Tsui, Kowloon, Hong Kong",
  rating: 3.8,
  reviewCount: 47,
  memberSince: 2019,
  market: "Hong Kong",
  verified: false,
  propertiesListed: 3,
};

const ratingDimensions = [
  { label: "Deposit return", score: 2.9 },
  { label: "Responsiveness", score: 4.1 },
  { label: "Listing accuracy", score: 3.6 },
  { label: "Maintenance & repairs", score: 3.2 },
  { label: "Renewal fairness", score: 4.4 },
];

const aiSummary =
  "Tenants report mixed experiences with Pacific Realty Holdings. Communication is generally responsive, with most queries answered within 24 hours. However, deposit returns have been a consistent concern — 14 of 47 reviewers reported deductions they considered unfair or unexplained. Maintenance response times vary significantly by property. Overall, tenants recommend conducting a thorough check-in inspection and documenting all pre-existing issues before signing.";

const redFlags = [
  { text: "Deposit disputes reported", count: 14 },
  { text: "Delayed maintenance response", count: 8 },
  { text: "Property condition below listing standard", count: 6 },
];

const reviews = [
  {
    id: 1,
    stars: 2,
    headline: "Deposit nightmare",
    text: "Moved out in perfect condition, had photos of everything. Still had HKD 8,000 deducted with no explanation. Took 3 months and multiple follow-ups to get any response. Would not rent again.",
    location: "Tai Kok Tsui",
    timeAgo: "3 weeks ago",
    category: "deposit",
  },
  {
    id: 2,
    stars: 5,
    headline: "Great experience overall",
    text: "Responsive landlord, fixed our AC within 2 days of reporting. Deposit returned in full within 2 weeks of moving out. Would happily rent from them again.",
    location: "Mong Kok",
    timeAgo: "2 months ago",
    category: "positive",
  },
  {
    id: 3,
    stars: 3,
    headline: "Average — communication good, maintenance slow",
    text: "Easy to reach by WhatsApp, which is a plus. But getting repairs actually done took weeks. Deposit returned but with a small deduction we didn't agree with.",
    location: "Tai Kok Tsui",
    timeAgo: "4 months ago",
    category: "maintenance",
  },
  {
    id: 4,
    stars: 1,
    headline: "Entered flat without notice",
    text: "Landlord entered the property multiple times without giving proper notice. Very uncomfortable experience. Raised it and was dismissed. Would strongly warn others.",
    location: "Sham Shui Po",
    timeAgo: "5 months ago",
    category: "critical",
  },
  {
    id: 5,
    stars: 4,
    headline: "Fair landlord, minor issues",
    text: "Generally positive. A couple of maintenance things took longer than expected but always resolved eventually. Renewal was offered at fair market rate.",
    location: "Tai Kok Tsui",
    timeAgo: "7 months ago",
    category: "positive",
  },
];

const similarProperties = [
  { address: "Unit 8A, Metro Residences, 22 Cherry St", rating: 4.1, reviews: 31 },
  { address: "Flat 3C, Harbour View Court, 9 Hoi Ting Rd", rating: 3.5, reviews: 18 },
  { address: "Studio 14, Tai Kok Tsui Mansions, 41 Pine Ave", rating: 4.6, reviews: 22 },
];

// ── LocalReview — unified shape used for both mock data and Supabase data ────

interface LocalReview {
  id: number | string;
  stars: number;
  headline: string;
  text: string;
  location: string;
  timeAgo: string;
  category: string;
}

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

function deriveCategory(r: Review): string {
  if (r.rating >= 4) return "positive";
  if (r.rating <= 2) return "critical";
  const body = r.body.toLowerCase();
  if (body.includes("deposit")) return "deposit";
  if (body.includes("mainten") || body.includes("repair")) return "maintenance";
  return "positive";
}

function toLocalReview(r: Review, index: number): LocalReview {
  return {
    id: `sb-${index}`,
    stars: r.rating,
    headline: r.headline,
    text: r.body,
    location: r.district,
    timeAgo: relativeTime(r.datePosted),
    category: deriveCategory(r),
  };
}

function computeRedFlags(rs: Review[]): { text: string; count: number }[] {
  const flags: { text: string; count: number }[] = [];
  const deposit = rs.filter((r) => r.dimensions.depositReturn <= 2).length;
  if (deposit > 0) flags.push({ text: "Deposit disputes reported", count: deposit });
  const maint = rs.filter((r) => r.dimensions.maintenance <= 2).length;
  if (maint > 0) flags.push({ text: "Delayed maintenance response", count: maint });
  const listing = rs.filter((r) => r.dimensions.listingAccuracy <= 2).length;
  if (listing > 0) flags.push({ text: "Property condition below listing standard", count: listing });
  return flags;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toRegion(r: "Kowloon" | "HK Island" | "New Territories" | undefined): PriceGuideRegion {
  if (r === "Kowloon") return "kowloon";
  if (r === "HK Island") return "hk_island";
  return "new_territories";
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FILTERS = ["All", "Positive", "Critical", "Deposit", "Maintenance"] as const;
type Filter = (typeof FILTERS)[number];

function filterReviews(list: LocalReview[], filter: Filter) {
  if (filter === "All") return list;
  return list.filter((r) => r.category === filter.toLowerCase());
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ stars, size = 15 }: { stars: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= stars
              ? "text-[#F59E0B] fill-[#F59E0B]"
              : "text-[#D8D8D8] fill-[#D8D8D8]"
          }
        />
      ))}
    </div>
  );
}

function AnimatedBar({ score }: { score: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const pct = (score / 5) * 100;

  return (
    <div
      ref={ref}
      className="flex-1 h-3 rounded-full"
      style={{ background: "#E4F0EB", position: "relative", overflow: "hidden" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: "#4D8B6F" }}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
      />
    </div>
  );
}

function cardFadeProps(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.55, ease: EASE, delay },
  };
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  /** Real landlord from Supabase; falls back to hardcoded mock when omitted */
  landlordData?: Landlord;
  /** Real reviews from Supabase; falls back to hardcoded mock when omitted */
  landlordReviews?: Review[];
  /** Address of the primary property (derived from first linked building) */
  primaryAddress?: string;
  linkedBuildings?: Building[];
}

export default function LandlordProfile({
  landlordData,
  landlordReviews,
  primaryAddress,
  linkedBuildings = [],
}: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [expanded, setExpanded] = useState<Set<number | string>>(new Set());
  const [priceGuideOpen, setPriceGuideOpen] = useState(false);

  // ── Data resolution: Supabase props > hardcoded mock ──────────────────────

  const landlordDisplay = landlordData
    ? {
        name: landlordData.name,
        address: primaryAddress ?? landlordData.name,
        rating: landlordData.avgRating,
        reviewCount: landlordData.totalReviews,
        memberSince: parseInt(landlordData.activeSince, 10) || 2019,
        market: landlordData.activeMarkets[0] ?? "Hong Kong",
        verified: landlordData.verified,
        propertiesListed: landlordData.totalProperties,
      }
    : landlord;

  const ratingDimensionsDisplay = landlordData
    ? [
        { label: "Deposit return",       score: landlordData.ratings.depositReturn },
        { label: "Responsiveness",        score: landlordData.ratings.responsiveness },
        { label: "Listing accuracy",      score: landlordData.ratings.listingAccuracy },
        { label: "Maintenance & repairs", score: landlordData.ratings.maintenance },
        { label: "Renewal fairness",      score: landlordData.ratings.renewalFairness },
      ]
    : ratingDimensions;

  const localReviews: LocalReview[] = landlordReviews && landlordReviews.length > 0
    ? landlordReviews.map(toLocalReview)
    : (reviews as LocalReview[]);

  const redFlagsDisplay = landlordReviews && landlordReviews.length > 0
    ? computeRedFlags(landlordReviews)
    : redFlags;

  const visibleReviews = filterReviews(localReviews, activeFilter);

  function toggleExpand(id: number | string) {
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

        {/* ── 1. Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[#6B7280] mb-8 flex-wrap">
          {["Hong Kong", "Kowloon", "Tai Kok Tsui"].map((crumb) => (
            <span key={crumb} className="flex items-center gap-1">
              <a href="#" className="text-[#4D8B6F] hover:underline transition-colors">
                {crumb}
              </a>
              <ChevronRight size={12} className="text-[#9CA3AF]" />
            </span>
          ))}
          <span className="font-medium text-[#555555]">{landlordDisplay.name}</span>
        </nav>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div className="w-full lg:w-[65%] flex flex-col gap-7">

            {/* ── 2. Profile Header ── */}
            <motion.div
              {...cardFadeProps(0)}
              className="bg-white rounded-[16px] p-8 relative"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              {/* Share */}
              <button
                aria-label="Share profile"
                className="absolute top-6 right-6 p-2.5 rounded-full transition-colors"
                style={{ background: "#F5F0E8" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE8E3")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F0E8")}
              >
                <Share2 size={16} className="text-[#6B7280]" />
              </button>

              {/* Name + address */}
              <h1 className="text-3xl sm:text-[36px] font-extrabold text-[#555555] tracking-tight leading-tight mb-2 pr-12">
                {landlordDisplay.name}
              </h1>
              <p className="text-sm text-[#6B7280] mb-6 flex items-start gap-1.5">
                <MapPin size={13} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                {landlordDisplay.address}
              </p>

              {/* Big rating */}
              <div className="flex items-center gap-5 mb-6">
                <span
                  className="font-extrabold leading-none"
                  style={{ fontSize: "60px", color: "#555555" }}
                >
                  {landlordDisplay.rating}
                </span>
                <div>
                  <StarRating stars={Math.round(landlordDisplay.rating)} size={26} />
                  <p className="text-sm text-[#6B7280] mt-1.5">
                    Based on {landlordDisplay.reviewCount} reviews
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  <MapPin size={11} />
                  {landlordDisplay.market}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "#EDE8E3", color: "#6B7280" }}
                >
                  {landlordDisplay.reviewCount} Reviews
                </span>
              </div>

              {/* Verified / Unverified pill */}
              {landlordDisplay.verified ? (
                <div
                  className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full"
                  style={{ background: "#E4F0EB", border: "1px solid #B0D4C3", color: "#1F5C42" }}
                >
                  <Shield size={12} />
                  <span><strong>Verified Landlord</strong> · Identity confirmed by RentRadar</span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full"
                  style={{ background: "#FDE8E3", border: "1px solid #F5C4B3", color: "#A83820" }}
                >
                  <Lock size={12} />
                  <span><strong>Unverified Profile</strong> · This profile has not been claimed by the landlord</span>
                </div>
              )}
            </motion.div>

            {/* ── 3. Rating Breakdown ── */}
            <motion.div
              {...cardFadeProps(0.05)}
              className="bg-white rounded-[16px] p-8"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <h2 className="text-lg font-bold text-[#555555] mb-6">
                How this landlord is rated
              </h2>
              <div className="flex flex-col gap-5">
                {ratingDimensionsDisplay.map(({ label, score }) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="text-sm text-[#6B7280] w-44 shrink-0">{label}</span>
                    <AnimatedBar score={score} />
                    <span
                      className="text-sm font-bold w-8 text-right shrink-0"
                      style={{ color: "#555555" }}
                    >
                      {score}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Area Price Guide (collapsible) ── */}
            <motion.div {...cardFadeProps(0.05)}>
              <button
                onClick={() => setPriceGuideOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 rounded-[16px] transition-colors group"
                style={{
                  background: priceGuideOpen ? "#E4F0EB" : "#fff",
                  border: "1px solid #E2D9CE",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  if (!priceGuideOpen)
                    (e.currentTarget as HTMLButtonElement).style.background = "#F5F0E8";
                }}
                onMouseLeave={(e) => {
                  if (!priceGuideOpen)
                    (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#555555" }}
                  >
                    Area price guide
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#E4F0EB", color: "#1F5C42" }}
                  >
                    Free · Govt data
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  style={{
                    color: "#6B7280",
                    transform: priceGuideOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>

              {priceGuideOpen && linkedBuildings.length > 0 && (
                <div className="mt-4">
                  <PriceGuide
                    buildingName={linkedBuildings[0].name}
                    district={linkedBuildings[0].district}
                    region={toRegion(linkedBuildings[0].region)}
                    landlordId={landlordData?.id}
                  />
                </div>
              )}

              {priceGuideOpen && linkedBuildings.length === 0 && (
                <div className="mt-4">
                  <PriceGuide
                    buildingName={landlordDisplay.name}
                    district="Tai Kok Tsui"
                    region="kowloon"
                    landlordId={landlordData?.id}
                  />
                </div>
              )}
            </motion.div>

            {/* ── 4. AI Summary ── */}
            <motion.div
              {...cardFadeProps(0.05)}
              className="rounded-[16px] p-8"
              style={{
                background: "#F5F0E8",
                borderLeft: "4px solid #555555",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-[#4D8B6F]" />
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "#4D8B6F" }}
                >
                  RentRadar AI Summary
                </span>
              </div>
              <p className="text-sm text-[#6B7280] leading-[1.75]">{aiSummary}</p>
            </motion.div>

            {/* ── 5. Red Flags ── */}
            <motion.div
              {...cardFadeProps(0.05)}
              className="rounded-[16px] p-8"
              style={{
                background: "#FDE8E3",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                borderLeft: "4px solid #E8573A",
              }}
            >
              <h2 className="text-lg font-bold text-[#555555] mb-5 flex items-center gap-2.5">
                <AlertTriangle size={18} style={{ color: "#E8573A" }} />
                Tenant Red Flags
              </h2>
              <div className="flex flex-wrap gap-2.5 mb-4">
                {redFlagsDisplay.map(({ text, count }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full"
                    style={{
                      background: "#FDE8E3",
                      border: "1px solid #F5C4B3",
                      color: "#A83820",
                    }}
                  >
                    <AlertTriangle size={11} />
                    {text} ({count} reviews)
                  </span>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Red flags are identified automatically from verified review content
              </p>
            </motion.div>

            {/* ── Write a Review Banner ── */}
            <div
              className="rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: "#555555" }}
            >
              <div>
                <p className="text-white font-bold text-lg leading-snug">
                  Rented from {landlordDisplay.name}?
                </p>
                <p className="text-sm mt-1" style={{ color: "#D1D5DB" }}>
                  Share your experience and help future tenants make a better decision.
                </p>
              </div>
              <Link
                href={`/review?landlord=${landlordData?.id ?? "pacific-realty-holdings"}`}
                className="shrink-0 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-[12px] transition-colors text-white"
                style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
              >
                <PenLine size={15} />
                Write a Review
              </Link>
            </div>

            {/* ── 6. Reviews ── */}
            <motion.div {...cardFadeProps(0.05)}>
              <div className="flex items-baseline gap-2 mb-5">
                <h2 className="text-xl font-bold text-[#555555]">What tenants say</h2>
                <span className="text-sm text-[#6B7280]">({landlordDisplay.reviewCount} reviews)</span>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="text-xs font-semibold px-4 py-2 rounded-full transition-all duration-150"
                    style={
                      activeFilter === f
                        ? { background: "#555555", color: "#fff" }
                        : {
                            background: "#fff",
                            color: "#6B7280",
                            border: "1px solid #E2D9CE",
                          }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Review cards */}
              <div className="flex flex-col gap-4">
                {visibleReviews.length === 0 && (
                  <p className="text-sm text-[#9CA3AF] py-8 text-center">
                    No reviews match this filter.
                  </p>
                )}
                {visibleReviews.slice(0, 1).map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07, ease: EASE }}
                    className="bg-white rounded-[16px] p-6"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                  >
                    <div className="mb-3">
                      <StarRating stars={review.stars} size={14} />
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
                      {review.text}
                    </p>
                    <button
                      onClick={() => toggleExpand(review.id)}
                      className="text-xs font-semibold mb-4 transition-colors"
                      style={{ color: "#4D8B6F" }}
                    >
                      {expanded.has(review.id) ? "Show less" : "Read more"}
                    </button>

                    <div className="flex items-center justify-between flex-wrap gap-3 pt-3"
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
                          {review.location} · {review.timeAgo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: "#9CA3AF" }}>
                        <span className="text-[11px]">Helpful?</span>
                        <button
                          className="p-1 rounded transition-colors hover:text-[#555555]"
                          aria-label="Mark helpful"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          className="p-1 rounded transition-colors hover:text-red-400"
                          aria-label="Mark not helpful"
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Subscription gate */}
                {localReviews.length > 1 && (
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
                      Read all {localReviews.length} reviews
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto leading-relaxed">
                      Subscribe to access every review for this landlord and every other property on RentRadar.
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

              {/* Load more */}
              <div className="mt-7 flex justify-center">
                <button
                  className="text-sm font-semibold px-8 py-3 rounded-[12px] transition-all duration-200"
                  style={{
                    border: "2px solid #555555",
                    color: "#555555",
                    background: "transparent",
                  }}
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
            </motion.div>

            {/* ── 7. Write a Review CTA ── */}
            <motion.div
              {...cardFadeProps(0.05)}
              className="rounded-[16px] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              style={{ background: "#555555" }}
            >
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  Rented from {landlordDisplay.name}?
                </h3>
                <p className="text-sm" style={{ color: "#D1D5DB" }}>
                  Your experience could protect someone else. Takes less than 3 minutes.
                </p>
              </div>
              <Link
                href={`/review?landlord=${landlordData?.id ?? "pacific-realty-holdings"}`}
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

          </div>

          {/* ════════════ RIGHT SIDEBAR ════════════ */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6 lg:sticky lg:top-[100px]">

            {/* ── 8. Quick Stats ── */}
            <motion.div
              {...cardFadeProps(0.1)}
              className="bg-white rounded-[16px] p-6"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Reviews", value: `${landlordDisplay.reviewCount}` },
                  { label: "Average", value: `${landlordDisplay.rating} / 5` },
                  { label: "Active since", value: `${landlordDisplay.memberSince}` },
                  { label: "Properties", value: `${landlordDisplay.propertiesListed}` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4"
                    style={{ background: "#F5F0E8" }}
                  >
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
                href={`/review?landlord=${landlordData?.id ?? "pacific-realty-holdings"}`}
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
              <button
                className="w-full text-sm font-medium flex items-center justify-center gap-1.5 py-2 transition-colors"
                style={{ color: "#4D8B6F" }}
              >
                <Share2 size={13} />
                Share this profile
              </button>
            </motion.div>

            {/* ── 9. Claim Profile ── */}
            <motion.div
              {...cardFadeProps(0.15)}
              className="bg-white rounded-[16px] p-6"
              style={{
                border: "2.5px dashed #555555",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} style={{ color: "#4D8B6F" }} />
                <h3 className="font-bold text-[#555555]">Are you this landlord?</h3>
              </div>
              <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">
                Claim your profile to respond to reviews, add property details, and earn your{" "}
                <strong className="text-[#555555]">Verified Landlord</strong> badge.
              </p>
              <button
                className="w-full font-semibold text-sm py-3 rounded-[12px] mb-2.5 transition-all duration-200"
                style={{
                  border: "2px solid #555555",
                  color: "#555555",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#555555";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#555555";
                }}
              >
                Claim This Profile
              </button>
              <p className="text-[11px] text-center" style={{ color: "#9CA3AF" }}>
                Free to claim. Verification required.
              </p>
            </motion.div>

            {/* ── Properties (linked buildings) ── */}
            {linkedBuildings.length > 0 && (
              <motion.div
                {...cardFadeProps(0.18)}
                className="bg-white rounded-[16px] p-6"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              >
                <h3 className="font-bold text-[#555555] mb-4">
                  Properties
                  <span className="ml-1.5 text-sm font-normal text-[#6B7280]">
                    ({linkedBuildings.length})
                  </span>
                </h3>
                <div className="flex flex-col">
                  {linkedBuildings.map((b, i) => (
                    <Link
                      key={b.id}
                      href={`/building/${b.id}`}
                      className="flex items-start justify-between py-4 gap-3 group"
                      style={
                        i < linkedBuildings.length - 1
                          ? { borderBottom: "1px solid #F5F0E8" }
                          : {}
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#555555] mb-1 group-hover:text-[#555555] transition-colors">
                          {b.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF] truncate mb-2">{b.address}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <GovDataBadge lastUpdated={b.govDataLastUpdated} size="sm" />
                          {b.statutoryOrders.some((o) => o.status === "Outstanding") && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "#FDE8E3", color: "#A83820" }}
                            >
                              <AlertTriangle size={9} />
                              Orders on record
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "#4D8B6F" }}
                      />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── 10. Similar Properties ── */}
            <motion.div
              {...cardFadeProps(0.2)}
              className="bg-white rounded-[16px] p-6"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <h3 className="font-bold text-[#555555] mb-4">Also in Tai Kok Tsui</h3>
              <div className="flex flex-col">
                {similarProperties.map((prop, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex items-center justify-between py-3.5 gap-3 group"
                    style={
                      i < similarProperties.length - 1
                        ? { borderBottom: "1px solid #F5F0E8" }
                        : {}
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#555555] truncate mb-1">
                        {prop.address}
                      </p>
                      <div className="flex items-center gap-2">
                        <StarRating stars={Math.round(prop.rating)} size={11} />
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>
                          {prop.rating} · {prop.reviews} reviews
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                      style={{ color: "#4D8B6F" }}
                    />
                  </a>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
