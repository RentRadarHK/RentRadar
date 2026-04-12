"use client";

import { Star, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

const reviews = [
  {
    address: "Flat 12B, ████ Tower, Wan Chai",
    rating: 2,
    quote:
      "Took 3 months to return my deposit and gave back only half with zero explanation. Multiple ignored messages.",
    city: "Hong Kong",
    timeAgo: "2 weeks ago",
  },
  {
    address: "Flat 8A, ██████ Court, Mid-Levels",
    rating: 5,
    quote:
      "Incredibly responsive landlord. Fixed every issue within 24 hours and returned my full deposit within 3 days of moving out. One of the best rentals I've had.",
    city: "Hong Kong",
    timeAgo: "3 weeks ago",
  },
  {
    address: "Unit 12-F, ████████, Happy Valley",
    rating: 5,
    quote:
      "Transparent from day one — flat was exactly as listed, no hidden costs, and every maintenance request was handled the same week. Would absolutely rent again.",
    city: "Hong Kong",
    timeAgo: "1 month ago",
  },
  {
    address: "Flat 3C, ████████ Building, Tai Kok Tsui",
    rating: 2,
    quote:
      "Maintenance requests ignored for weeks. Had to chase constantly. Deposit returned but with unexplained deductions totalling HKD 6,000.",
    city: "Hong Kong",
    timeAgo: "6 weeks ago",
  },
  {
    address: "Flat 5D, ██████ House, Kennedy Town",
    rating: 5,
    quote:
      "Great experience overall. Landlord was fair, flat was exactly as described, and deposit was returned in full within 10 days. Would rent again.",
    city: "Hong Kong",
    timeAgo: "2 months ago",
  },
];

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

export default function ReviewCards() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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
        {reviews.map((review, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
            className="snap-start bg-white rounded-card p-6 flex-shrink-0 w-[300px] sm:w-[320px] flex flex-col gap-4 border border-[#E2D9CE]"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            {/* City tag */}
            <span className="inline-block text-xs font-semibold text-[#555555] bg-[#E4F0EB] px-3 py-1 rounded-full self-start">
              {review.city}
            </span>

            {/* Address */}
            <p className="text-[#9CA3AF] text-xs font-medium leading-snug">
              {review.address}
            </p>

            {/* Stars */}
            <StarRating rating={review.rating} />

            {/* Quote */}
            <p className="text-[#6B7280] text-sm leading-relaxed flex-1">
              &ldquo;{review.quote}&rdquo;
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2D9CE]">
              <span className="text-[#9CA3AF] text-xs">{review.timeAgo}</span>
              <span className="flex items-center gap-1 text-[#555555] text-xs font-semibold">
                <BadgeCheck size={13} />
                Verified Tenant
              </span>
            </div>
          </motion.div>
        ))}

        {/* Right padding sentinel */}
        <div className="shrink-0 w-5" />
      </div>
    </section>
  );
}
