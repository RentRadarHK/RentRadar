"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquareReply,
  ShieldCheck,
  Pencil,
  Building2,
  User,
} from "lucide-react";
import { searchAll } from "@/lib/supabase/queries";
import type { SearchResult } from "@/lib/data/types";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" } as const,
    transition: { duration: 0.55, ease: EASE, delay },
  };
}

const benefits = [
  {
    icon: MessageSquareReply,
    title: "Respond to reviews",
    body: "Post a professional public response to any tenant review on your profile.",
  },
  {
    icon: ShieldCheck,
    title: "Get verified",
    body: "Upload proof of ownership and earn the Verified Landlord badge on your profile.",
  },
  {
    icon: Pencil,
    title: "Edit your profile",
    body: "Add a bio, contact details, and website so quality tenants can reach you directly.",
  },
];

const steps = [
  {
    title: "Search your name",
    desc: "Find your building or landlord profile",
  },
  {
    title: "Submit a claim",
    desc: "Upload proof of ownership or management",
  },
  {
    title: "Get verified",
    desc: "We review within 1-2 business days",
  },
  {
    title: "Manage profile",
    desc: "Respond, edit, and track your reputation",
  },
];

export default function ForLandlordsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(() => {
      searchAll(query)
        .then(({ buildings, landlords }) => {
          const combined = [...buildings.slice(0, 5), ...landlords.slice(0, 5)];
          setResults(combined);
          setShowDropdown(combined.length > 0);
        })
        .catch(() => {});
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

  function resultHref(r: SearchResult) {
    return r.type === "building" ? `/building/${r.id}` : `/landlord/${r.id}`;
  }

  function resultTag(r: SearchResult) {
    if (r.type === "building") return r.district || "Building";
    return "Landlord";
  }

  return (
    <div style={{ background: "#F5F0E8" }}>
      {/* Hero */}
      <section className="pt-32 pb-20 px-5 sm:px-8" style={{ background: "#F5F0E8" }}>
        <div className="max-w-[720px] mx-auto">
          <motion.div {...fadeUp(0)}>
            <span
              className="inline-block text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: "#E4F0EB", color: "#4D8B6F" }}
            >
              For landlords and agents
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="text-4xl sm:text-5xl md:text-[52px] font-extrabold leading-tight mb-5"
            style={{ color: "#555555" }}
          >
            Your reputation,{" "}
            <span style={{ color: "#4D8B6F" }}>under your control</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="text-lg leading-relaxed mb-10 max-w-[560px]"
            style={{ color: "#6B7280" }}
          >
            Search for your building or name to find your RentRadar profile. Claim it,
            get verified, and start responding to tenant reviews.
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="max-w-[560px]">
            <label
              htmlFor="landlord-search"
              className="block text-sm font-semibold mb-2"
              style={{ color: "#555555" }}
            >
              Search for your building or landlord name
            </label>

            <div ref={containerRef} className="relative">
              <div
                className="flex items-center bg-white rounded-[14px] overflow-hidden border"
                style={{ borderColor: "#E2D9CE", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
              >
                <Search size={18} className="ml-4 text-[#9CA3AF] shrink-0" />
                <input
                  id="landlord-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  placeholder="e.g. Pacific Realty, 99 Robinson Road..."
                  className="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-[#9CA3AF]"
                  style={{ color: "#555555" }}
                />
                <button
                  onClick={handleSearch}
                  className="text-white text-sm font-semibold px-6 py-3 m-1.5 rounded-full shrink-0 transition-colors hover:shadow-md"
                  style={{ background: "#4D8B6F" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#3A7059")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#4D8B6F")}
                >
                  Search
                </button>
              </div>

              {showDropdown && results.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] z-50 overflow-hidden border"
                  style={{ borderColor: "#E2D9CE", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
                >
                  <div className="max-h-[320px] overflow-y-auto">
                    {results.map((r) => (
                      <Link
                        key={`${r.type}-${r.id}`}
                        href={resultHref(r)}
                        onClick={() => setShowDropdown(false)}
                      >
                        <div
                          className="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                          style={{ borderBottom: "1px solid #F5F0E8" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0E8")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: r.type === "building" ? "#E4F0EB" : "#EDE8E3" }}
                          >
                            {r.type === "building" ? (
                              <Building2 size={15} style={{ color: "#555555" }} />
                            ) : (
                              <User size={15} style={{ color: "#6B7280" }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#555555" }}>
                              {r.name}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                              {r.type === "building" ? r.address : r.market}
                            </p>
                          </div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0"
                            style={{
                              background: r.type === "building" ? "#E4F0EB" : "#EDE8E3",
                              color: "#4D8B6F",
                            }}
                          >
                            {resultTag(r)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm mt-4" style={{ color: "#9CA3AF" }}>
              Can&apos;t find your profile?{" "}
              <a
                href="mailto:joe@rentradar.co"
                className="font-semibold hover:underline"
                style={{ color: "#4D8B6F" }}
              >
                Contact us
              </a>{" "}
              and we&apos;ll create one.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-5 sm:px-8" style={{ background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp(i * 0.1)}
                className="rounded-[14px] p-7 border"
                style={{ background: "#F5F0E8", borderColor: "#E2D9CE" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
                  style={{ background: "#E4F0EB" }}
                >
                  <b.icon size={20} style={{ color: "#4D8B6F" }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#555555" }}>
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  {b.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-5 sm:px-8" style={{ background: "#F5F0E8" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.p
            {...fadeUp(0)}
            className="text-xs font-bold uppercase tracking-widest text-center mb-12"
            style={{ color: "#4D8B6F" }}
          >
            How it works
          </motion.p>

          <div className="relative">
            <div
              className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px"
              style={{ background: "#E2D9CE" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  {...fadeUp(i * 0.08)}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mb-4 relative z-10"
                    style={{ background: "#4D8B6F" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="text-[15px] font-bold mb-2" style={{ color: "#555555" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-[200px]" style={{ color: "#6B7280" }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <section className="py-6 px-5 sm:px-8" style={{ background: "#555555" }}>
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-white/80 text-center sm:text-left">
            Free to claim. No subscription required to respond to reviews.
          </p>
          <Link
            href="/terms"
            className="text-white/60 hover:text-white transition-colors shrink-0"
          >
            T&amp;Cs apply
          </Link>
        </div>
      </section>
    </div>
  );
}
