"use client";

import { Search, Star, Building2, User } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { searchAll } from "@/lib/supabase/queries";
import type { SearchResult } from "@/lib/data/types";
import HeroGraphic from "@/components/HeroGraphic";

type BezierTuple = [number, number, number, number];
const EASE: BezierTuple = [0.22, 1, 0.36, 1];

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay: i * 0.1 },
  };
}

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      searchAll(query).then(({ buildings, landlords }) => {
        const combined = [...buildings.slice(0, 5), ...landlords.slice(0, 3)];
        setResults(combined);
        setShowDropdown(combined.length > 0);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSearch() {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowDropdown(false);
  }

  const buildingResults = results.filter((r) => r.type === "building");
  const landlordResults = results.filter((r) => r.type === "landlord");

  return (
    <section
      id="search"
      className="relative min-h-screen flex items-center pt-20 pb-16 px-5 sm:px-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #F5F0E8 0%, #EDE8E3 100%)",
      }}
    >
      {/* City skyline illustration */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <HeroGraphic />
      </motion.div>

      <div className="relative z-10 max-w-[1200px] mx-auto w-full">
        <div className="max-w-[660px]">
          {/* Eyebrow */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 bg-[#E4F0EB] text-[#555555] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#555555] animate-pulse" />
            Your rental research starts here
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(1)}
            className="text-[52px] sm:text-[64px] md:text-[72px] font-extrabold leading-[1.04] tracking-tight mb-6"
            style={{ color: "#555555" }}
          >
            Know your rental.<br />
            <span style={{ color: "#4D8B6F" }}>Before you sign.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(2)}
            className="text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-10 max-w-[520px]"
          >
            Things you need to know before signing a lease in Hong Kong.
            Building data, tenant reviews, and landlord history — all in one place.
          </motion.p>

          {/* Search bar + dropdown */}
          <motion.div {...fadeUp(3)} className="mb-7">
            <div ref={containerRef} className="relative">
              <div
                className="flex items-center bg-white rounded-search overflow-hidden transition-shadow duration-200"
                style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}
              >
                <Search size={18} className="ml-5 text-[#9CA3AF] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search landlord name, building or address..."
                  aria-label="Search landlord, building, or address"
                  className="flex-1 bg-transparent px-4 py-4 text-sm text-[#555555] placeholder:text-[#9CA3AF] outline-none focus-visible:ring-2 focus-visible:ring-[#4D8B6F] focus-visible:ring-inset"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#4D8B6F] hover:bg-[#3A7059] text-white text-sm font-semibold px-6 py-3.5 m-1.5 rounded-[18px] shrink-0 transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8B6F] focus-visible:ring-offset-2"
                >
                  Search
                </button>
              </div>

              {/* Dropdown */}
              {showDropdown && results.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] z-50 overflow-hidden"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
                >
                  <div className="max-h-[380px] overflow-y-auto">

                    {/* Buildings section */}
                    {buildingResults.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1.5" style={{ background: "#F5F0E8" }}>
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: "#9CA3AF" }}
                          >
                            Buildings
                          </span>
                        </div>
                        {buildingResults.map((r) => (
                          <Link
                            key={r.id}
                            href={`/building/${r.id}`}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div
                              className="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                              style={{ borderBottom: "1px solid #F5F0E8" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F5F0E8")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "")
                              }
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: "#E4F0EB" }}
                              >
                                <Building2 size={15} style={{ color: "#555555" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-sm font-semibold text-[#555555] truncate">
                                    {r.name}
                                  </p>
                                  {r.badge === "Orders on Record" && (
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                      style={{ background: "#FDE8E3", color: "#A83820" }}
                                    >
                                      Orders
                                    </span>
                                  )}
                                  {r.badge === "Top Rated" && (
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                      style={{ background: "#E4F0EB", color: "#1F5C42" }}
                                    >
                                      Top Rated
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                                  {r.address} · {r.district}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
                                <span className="text-xs font-semibold text-[#555555]">
                                  {r.rating}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}

                    {/* Landlords section */}
                    {landlordResults.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1.5" style={{ background: "#F5F0E8" }}>
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: "#9CA3AF" }}
                          >
                            Landlords
                          </span>
                        </div>
                        {landlordResults.map((r) => (
                          <Link
                            key={r.id}
                            href={`/landlord/${r.id}`}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div
                              className="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                              style={{ borderBottom: "1px solid #F5F0E8" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F5F0E8")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "")
                              }
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: "#EDE8E3" }}
                              >
                                <User size={15} style={{ color: "#6B7280" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-sm font-semibold text-[#555555] truncate">
                                    {r.name}
                                  </p>
                                  {r.badge === "Verified" && (
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                      style={{ background: "#E4F0EB", color: "#1F5C42" }}
                                    >
                                      ✓ Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                                  {r.market} · {r.reviewCount} reviews
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
                                <span className="text-xs font-semibold text-[#555555]">
                                  {r.rating}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-4 py-3"
                    style={{ borderTop: "1px solid #F5F0E8" }}
                  >
                    <button
                      onClick={handleSearch}
                      className="text-xs font-semibold w-full text-center hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8B6F] rounded-sm"
                      style={{ color: "#4D8B6F" }}
                    >
                      Press Enter to search all results →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div {...fadeUp(4)}>
            <p className="text-sm italic" style={{ color: "#9CA3AF" }}>
              Launching in Hong Kong · Be one of our first reviewers
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5F0E8] to-transparent" />
    </section>
  );
}
