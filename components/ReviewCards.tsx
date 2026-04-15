"use client";

import { Star, BadgeCheck, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ReviewCard {
  id: string;
  district: string;
  rating: number;
  quote: string;
  timeAgo: string;
  verifiedTenant: boolean;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? "text-[#F59E0B] fill-[#F59E0B]"
              : "text-[#E2D9CE] fill-[#E2D9CE]"
          }
        />
      ))}
    </div>
  );
}

function EmptyCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="snap-start rounded-card p-6 flex-shrink-0 w-[300px] sm:w-[320px] flex flex-col items-center justify-center gap-4"
      style={{
        background: "white",
        border: "1.5px dashed #E2D9CE",
        minHeight: "220px",
      }}
    >
      <PenLine size={24} style={{ color: "#9CA3AF" }} />
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: "#555555" }}>
          Be one of our first reviewers
        </p>
        <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
          Share your HK rental experience
        </p>
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          style={{ background: "#4D8B6F", color: "#fff" }}
        >
          Write a Review
        </Link>
      </div>
    </motion.div>
  );
}

export default function ReviewCards() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    type ReviewRow = {
      id: string;
      created_at: string;
      rating_overall: number;
      review_text: string | null;
      building_day_to_day: string | null;
      landlord_experience: string | null;
      verified_tenant: boolean;
      buildings: { district: string }[] | { district: string } | null;
    };

    supabase
      .from("reviews")
      .select("id, created_at, rating_overall, review_text, building_day_to_day, landlord_experience, verified_tenant, buildings(district)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setCards(
            (data as ReviewRow[]).map((r) => ({
              id: r.id,
              district: (Array.isArray(r.buildings) ? r.buildings[0]?.district : r.buildings?.district) ?? "Hong Kong",
              rating: r.rating_overall,
              quote:
                r.building_day_to_day ||
                r.landlord_experience ||
                r.review_text ||
                "",
              timeAgo: relativeTime(r.created_at),
              verifiedTenant: r.verified_tenant,
            }))
          );
        }
        setLoaded(true);
      });
  }, []);

  const emptyCount = loaded ? Math.max(0, 5 - cards.length) : 0;

  return (
    <section ref={ref} className="py-20 bg-[#F5F0E8] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 mb-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[#4D8B6F] text-xs font-semibold uppercase tracking-widest mb-3"
        >
          Real experiences
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-3xl sm:text-4xl font-bold text-[#555555]"
        >
          What tenants discovered before signing
        </motion.h2>
      </div>

      {/* Snap-scroll strip */}
      <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x px-5 sm:px-8 pb-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
            className="snap-start bg-white rounded-card p-6 flex-shrink-0 w-[300px] sm:w-[320px] flex flex-col gap-4 border border-[#E2D9CE]"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            {/* District tag */}
            <span className="inline-block text-xs font-semibold text-[#555555] bg-[#E4F0EB] px-3 py-1 rounded-full self-start">
              {card.district}
            </span>

            {/* Stars */}
            <StarRating rating={card.rating} />

            {/* Quote */}
            <p
              className="text-sm leading-relaxed flex-1 line-clamp-4"
              style={{ color: "#6B7280" }}
            >
              &ldquo;{card.quote}&rdquo;
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2D9CE]">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                {card.timeAgo}
              </span>
              {card.verifiedTenant && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#555555" }}>
                  <BadgeCheck size={13} />
                  Verified Tenant
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {Array.from({ length: emptyCount }).map((_, i) => (
          <EmptyCard key={`empty-${i}`} delay={0.1 + (cards.length + i) * 0.07} />
        ))}

        {/* Right padding sentinel */}
        <div className="shrink-0 w-5" />
      </div>
    </section>
  );
}
