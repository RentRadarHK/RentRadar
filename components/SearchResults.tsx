"use client";

import { useState, useEffect, useRef } from "react";
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
const SORT_CHIPS = ["Most reviewed", "Highest rated", "Recent issues", "Has govt orders"] as const;
type SortChip = (typeof SORT_CHIPS)[number];

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
  const [activeSort, setActiveSort] = useState<SortChip>("Most reviewed");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allBuildings, setAllBuildings] = useState<SearchResult[]>([]);
  const [allLandlords, setAllLandlords] = useState<SearchResult[]>([]);
  const [totalCounts, setTotalCounts] = useState<{ buildings: number; landlords: number } | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const buildingSuggestions = suggestions.filter((r) => r.type === "building").slice(0, 5);
  const landlordSuggestions = suggestions.filter((r) => r.type === "landlord").slice(0, 3);
  const suggestionItems = [...buildingSuggestions, ...landlordSuggestions];

  function handleSearch() {
    const trimmed = inputQ.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    else router.push("/search");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  }

  function handleSuggestionSelect(result: SearchResult) {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    router.push(result.type === "building" ? `/building/${result.id}` : `/landlord/${result.id}`);
  }

  // Fetch live totals once on mount
  useEffect(() => {
    getCounts().then(setTotalCounts);
  }, []);

  // Close predictive dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keep the search box value in sync with URL changes (e.g. back/forward)
  useEffect(() => {
    setInputQ(query);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    let cancelled = false;

    searchAll(query.length >= 2 ? query : "")
      .then(({ buildings, landlords }) => {
        if (cancelled) return;
        setAllBuildings(buildings);
        setAllLandlords(landlords);
      })
      .catch(() => {
        if (cancelled) return;
        setAllBuildings([]);
        setAllLandlords([]);
        setFetchError("We hit a temporary issue loading search results. Please try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  // Predictive search suggestions while user types (same behavior as homepage)
  useEffect(() => {
    const trimmed = inputQ.trim();
    if (trimmed.length < 2 || trimmed === query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchAll(trimmed)
        .then(({ buildings, landlords }) => {
          if (cancelled) return;
          const combined = [...buildings.slice(0, 5), ...landlords.slice(0, 3)];
          setSuggestions(combined);
          setShowSuggestions(combined.length > 0);
          setActiveSuggestionIndex(-1);
        })
        .catch(() => {
          if (cancelled) return;
          setSuggestions([]);
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputQ, query]);

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

  function applySort(buildings: SearchResult[], landlords: SearchResult[]): {
    buildings: SearchResult[];
    landlords: SearchResult[];
  } {
    const byReviews = (a: SearchResult, b: SearchResult) =>
      b.reviewCount - a.reviewCount || b.rating - a.rating;
    const byRating = (a: SearchResult, b: SearchResult) =>
      b.rating - a.rating || b.reviewCount - a.reviewCount;

    if (activeSort === "Most reviewed") {
      return {
        buildings: [...buildings].sort(byReviews),
        landlords: [...landlords].sort(byReviews),
      };
    }

    if (activeSort === "Highest rated") {
      return {
        buildings: [...buildings].sort(byRating),
        landlords: [...landlords].sort(byRating),
      };
    }

    if (activeSort === "Recent issues") {
      return {
        buildings: [...buildings].sort((a, b) => {
          const aIssue = a.badge === "Orders on Record" ? 1 : 0;
          const bIssue = b.badge === "Orders on Record" ? 1 : 0;
          return bIssue - aIssue || byReviews(a, b);
        }),
        landlords: [...landlords].sort(byReviews),
      };
    }

    // Has govt orders
    return {
      buildings: buildings
        .filter((r) => r.badge === "Orders on Record")
        .sort(byReviews),
      landlords: [],
    };
  }

  const { buildings: sortedBuildings, landlords: sortedLandlords } = applySort(
    visibleBuildings,
    visibleLandlords
  );

  const totalResults = sortedBuildings.length + sortedLandlords.length;
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
          <div ref={searchContainerRef} className="relative">
            <div
              className="flex items-center bg-white rounded-full overflow-hidden"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: "1px solid #E2D9CE" }}
            >
              <Search size={18} className="ml-5 shrink-0" style={{ color: "#9CA3AF" }} />
              <input
                type="text"
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                onFocus={() => {
                  if (suggestionItems.length > 0 && inputQ.trim().length >= 2) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && showSuggestions && suggestionItems.length > 0) {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) =>
                      prev < suggestionItems.length - 1 ? prev + 1 : 0
                    );
                    return;
                  }
                  if (e.key === "ArrowUp" && showSuggestions && suggestionItems.length > 0) {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) =>
                      prev > 0 ? prev - 1 : suggestionItems.length - 1
                    );
                    return;
                  }
                  if (e.key === "Enter") {
                    if (showSuggestions && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestionItems.length) {
                      e.preventDefault();
                      handleSuggestionSelect(suggestionItems[activeSuggestionIndex]);
                      return;
                    }
                    handleSearch();
                  }
                  if (e.key === "Escape") {
                    setShowSuggestions(false);
                    setActiveSuggestionIndex(-1);
                  }
                }}
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

            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] z-20 overflow-hidden"
                style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
              >
                <div className="max-h-[380px] overflow-y-auto">
                  {buildingSuggestions.map((r, idx) => (
                      <button
                        key={`building-${r.id}`}
                        onClick={() => handleSuggestionSelect(r)}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-[#F5F0E8]"
                        style={{
                          borderBottom: "1px solid #F5F0E8",
                          background: activeSuggestionIndex === idx ? "#F5F0E8" : "transparent",
                        }}
                        aria-selected={activeSuggestionIndex === idx}
                        role="option"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#E4F0EB]">
                            <Building2 size={15} style={{ color: "#555555" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#555555] truncate">{r.name}</p>
                            <p className="text-xs text-[#9CA3AF] truncate">{r.address} · {r.district}</p>
                          </div>
                        </div>
                      </button>
                    ))}

                  {landlordSuggestions.map((r, landlordIdx) => {
                    const idx = buildingSuggestions.length + landlordIdx;
                    return (
                      <button
                        key={`landlord-${r.id}`}
                        onClick={() => handleSuggestionSelect(r)}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-[#F5F0E8]"
                        style={{
                          borderBottom: "1px solid #F5F0E8",
                          background: activeSuggestionIndex === idx ? "#F5F0E8" : "transparent",
                        }}
                        aria-selected={activeSuggestionIndex === idx}
                        role="option"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EDE8E3]">
                            <User size={15} style={{ color: "#6B7280" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#555555] truncate">{r.name}</p>
                            <p className="text-xs text-[#9CA3AF] truncate">{r.market} · {r.reviewCount} reviews</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-3 text-xs font-semibold transition-colors hover:underline"
                  style={{ color: "#4D8B6F" }}
                >
                  Press Enter to search all results →
                </button>
              </div>
            )}
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

        {/* Decision-focused quick sort chips */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8170] mb-2">
            Quick sort
          </p>
          <div className="flex flex-wrap gap-2">
            {SORT_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveSort(chip)}
                className="text-xs font-semibold px-4 py-2.5 rounded-full transition-all duration-150"
                style={
                  activeSort === chip
                    ? { background: "#4D8B6F", color: "#fff" }
                    : { background: "#fff", color: "#6B7280", border: "1px solid #E2D9CE" }
                }
              >
                {chip}
              </button>
            ))}
          </div>
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

        {/* Error state */}
        {!loading && fetchError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[16px] p-8 text-center"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <p className="text-base font-bold text-[#555555] mb-2">Search is temporarily unavailable</p>
            <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
              {fetchError}
            </p>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
              style={{ background: "#4D8B6F" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3A7059")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4D8B6F")}
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Results — split or unified */}
        {!loading && !fetchError && !noResults && totalResults > 0 && (
          <div className={splitView ? "flex flex-col lg:flex-row gap-8 items-start" : ""}>

            {/* Buildings column */}
            {sortedBuildings.length > 0 && (
              <div className={splitView ? "w-full lg:w-1/2" : "w-full"}>
                {splitView && (
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 size={15} style={{ color: "#555555" }} />
                    <h2 className="font-bold text-[#555555]">
                      Buildings
                      <span className="ml-2 text-sm font-normal text-[#6B7280]">
                        ({sortedBuildings.length})
                      </span>
                    </h2>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {sortedBuildings.map((r, i) => (
                    <ResultCard key={r.id} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Landlords column */}
            {sortedLandlords.length > 0 && (
              <div className={splitView ? "w-full lg:w-1/2" : "w-full mt-8"}>
                {splitView && (
                  <div className="flex items-center gap-2 mb-4">
                    <User size={15} style={{ color: "#6B7280" }} />
                    <h2 className="font-bold text-[#555555]">
                      Landlords
                      <span className="ml-2 text-sm font-normal text-[#6B7280]">
                        ({sortedLandlords.length})
                      </span>
                    </h2>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {sortedLandlords.map((r, i) => (
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
