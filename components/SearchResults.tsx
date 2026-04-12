"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, User, Star, AlertTriangle, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { searchAll, getCounts } from "@/lib/supabase/queries";
import { SearchResult } from "@/lib/data/types";
import GovDataBadge from "./GovDataBadge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FILTERS = ["All", "Buildings", "Landlords", "With Reviews", "Government Orders"] as const;
type Filter = (typeof FILTERS)[number];

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? "text-[#F59E0B] fill-[#F59E0B]"
              : "text-[#D8D8D8] fill-[#D8D8D8]"
          }
        />
      ))}
    </div>
  );
}

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const href = result.type === "building" ? `/building/${result.id}` : `/landlord/${result.id}`;
  const isBuilding = result.type === "building";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: EASE }}
    >
      <Link href={href}>
        <div
          className="bg-white rounded-[16px] p-5 flex items-start gap-4 group transition-shadow"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 8px 40px rgba(0,0,0,0.10)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 4px 24px rgba(0,0,0,0.06)")
          }
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isBuilding ? "#E4F0EB" : "#EDE8E3" }}
          >
            {isBuilding ? (
              <Building2 size={18} style={{ color: "#555555" }} />
            ) : (
              <User size={18} style={{ color: "#6B7280" }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-[#555555] text-[15px] leading-snug group-hover:text-[#555555] transition-colors">
                {result.name}
              </h3>
              <ChevronRight
                size={15}
                className="shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
                style={{ color: "#4D8B6F" }}
              />
            </div>

            {result.address && (
              <p className="text-xs text-[#6B7280] mb-2 truncate">{result.address}</p>
            )}
            {!result.address && (
              <p className="text-xs text-[#6B7280] mb-2">{result.market}</p>
            )}

            {/* Rating + meta */}
            <div className="flex flex-wrap items-center gap-2.5">
              <StarRating rating={result.rating} />
              <span className="text-xs font-semibold text-[#555555]">{result.rating}</span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                {result.reviewCount} reviews
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#E4F0EB", color: "#1F5C42" }}
              >
                {result.market}
              </span>
              {result.govDataAvailable && (
                <GovDataBadge lastUpdated="2024-11-01" size="sm" />
              )}
              {result.badge === "Verified" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  ✓ Verified
                </span>
              )}
              {result.badge === "Orders on Record" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{ background: "#FDE8E3", color: "#A83820" }}
                >
                  <AlertTriangle size={9} />
                  Orders
                </span>
              )}
              {result.badge === "Top Rated" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#E4F0EB", color: "#1F5C42" }}
                >
                  ★ Top Rated
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-[16px] p-5 flex items-start gap-4 animate-pulse"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#EDE8E3] shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-2/3 rounded-lg bg-[#E2D9CE] mb-2" />
            <div className="h-3 w-1/2 rounded-full bg-[#E2D9CE] mb-3" />
            <div className="flex gap-2">
              <div className="h-3 w-20 rounded-full bg-[#E2D9CE]" />
              <div className="h-3 w-16 rounded-full bg-[#E2D9CE]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const [inputQ, setInputQ] = useState(query);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [allBuildings, setAllBuildings] = useState<SearchResult[]>([]);
  const [allLandlords, setAllLandlords] = useState<SearchResult[]>([]);
  const [totalCounts, setTotalCounts] = useState<{ buildings: number; landlords: number } | null>(null);

  function handleSearch() {
    const trimmed = inputQ.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    else router.push("/search");
  }

  // Fetch live totals once on mount
  useEffect(() => {
    getCounts().then(setTotalCounts);
  }, []);

  useEffect(() => {
    setLoading(true);
    searchAll(query.length >= 2 ? query : "").then(({ buildings, landlords }) => {
      setAllBuildings(buildings);
      setAllLandlords(landlords);
      setLoading(false);
    });
  }, [query]);

  const searchedBuildings = allBuildings;
  const searchedLandlords = allLandlords;

  // Apply active filter
  function applyFilter(buildings: SearchResult[], landlords: SearchResult[]): {
    buildings: SearchResult[];
    landlords: SearchResult[];
  } {
    switch (activeFilter) {
      case "Buildings":
        return { buildings, landlords: [] };
      case "Landlords":
        return { buildings: [], landlords };
      case "With Reviews":
        return {
          buildings: buildings.filter((r) => r.reviewCount > 0),
          landlords: landlords.filter((r) => r.reviewCount > 0),
        };
      case "Government Orders":
        return {
          buildings: buildings.filter((r) => r.badge === "Orders on Record"),
          landlords: [],
        };
      default:
        return { buildings, landlords };
    }
  }

  const { buildings: visibleBuildings, landlords: visibleLandlords } = applyFilter(
    searchedBuildings,
    searchedLandlords
  );

  const totalResults = visibleBuildings.length + visibleLandlords.length;
  const noResults = !loading && query.length >= 2 && totalResults === 0;

  // Split view: show two columns when "All" is active
  const splitView = activeFilter === "All";

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-24">

        {/* Header */}
        <div className="mb-8">
          {query ? (
            <>
              <p className="text-xs text-[#9CA3AF] mb-1">Search results</p>
              <h1 className="text-3xl font-extrabold text-[#555555] tracking-tight">
                &ldquo;{query}&rdquo;
              </h1>
              {!noResults && (
                <p className="text-sm text-[#6B7280] mt-1">
                  {totalResults} result{totalResults !== 1 ? "s" : ""} found
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-[#555555] tracking-tight mb-1">
                Browse all listings
              </h1>
              <p className="text-sm text-[#6B7280]">
                {totalCounts
                  ? `${totalCounts.buildings.toLocaleString()} buildings and ${totalCounts.landlords.toLocaleString()} landlord${totalCounts.landlords !== 1 ? "s" : ""} in Hong Kong`
                  : "Loading…"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                Search above to find a specific building or landlord
              </p>
            </>
          )}
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div
            className="flex items-center bg-white rounded-full overflow-hidden"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: "1px solid #E2D9CE" }}
          >
            <Search size={18} className="ml-5 shrink-0" style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search buildings, landlords, districts…"
              className="flex-1 px-4 py-4 text-sm bg-transparent outline-none placeholder:text-[#9CA3AF] text-[#555555]"
            />
            <button
              onClick={handleSearch}
              className="mr-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
              style={{ background: "#4D8B6F" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3A7059")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4D8B6F")}
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
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

        {/* Loading state */}
        {loading && <SearchSkeleton />}

        {/* Empty state */}
        {!loading && noResults && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[16px] p-12 text-center"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <Search size={32} className="mx-auto mb-4" style={{ color: "#9CA3AF" }} />
            <p className="text-lg font-bold text-[#555555] mb-2">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
              Try a district name, building name, or landlord company.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {["Wan Chai", "Kowloon", "Mid-Levels", "Sai Ying Pun", "Tseung Kwan O"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInputQ(s); router.push(`/search?q=${encodeURIComponent(s)}`); }}
                  className="text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                  style={{ background: "#F5F0E8", color: "#555555", border: "1px solid #E4F0EB" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#E4F0EB")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#F5F0E8")}
                >
                  Try: {s}
                </button>
              ))}
            </div>
            <Link
              href="/search"
              className="text-sm font-semibold transition-colors hover:underline"
              style={{ color: "#4D8B6F" }}
            >
              Browse all buildings →
            </Link>
          </motion.div>
        )}

        {/* Results — split or unified */}
        {!loading && !noResults && totalResults > 0 && (
          <div className={splitView ? "flex flex-col lg:flex-row gap-8 items-start" : ""}>

            {/* Buildings column */}
            {visibleBuildings.length > 0 && (
              <div className={splitView ? "w-full lg:w-1/2" : "w-full"}>
                {splitView && (
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 size={15} style={{ color: "#555555" }} />
                    <h2 className="font-bold text-[#555555]">
                      Buildings
                      <span className="ml-2 text-sm font-normal text-[#6B7280]">
                        ({visibleBuildings.length})
                      </span>
                    </h2>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {visibleBuildings.map((r, i) => (
                    <ResultCard key={r.id} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Landlords column */}
            {visibleLandlords.length > 0 && (
              <div className={splitView ? "w-full lg:w-1/2" : "w-full mt-8"}>
                {splitView && (
                  <div className="flex items-center gap-2 mb-4">
                    <User size={15} style={{ color: "#6B7280" }} />
                    <h2 className="font-bold text-[#555555]">
                      Landlords
                      <span className="ml-2 text-sm font-normal text-[#6B7280]">
                        ({visibleLandlords.length})
                      </span>
                    </h2>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {visibleLandlords.map((r, i) => (
                    <ResultCard key={r.id} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
