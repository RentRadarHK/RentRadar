"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

type BezierTuple = [number, number, number, number];
const EASE: BezierTuple = [0.22, 1, 0.36, 1];

const stats = [
  { value: "51,000+", label: "Buildings" },
  { value: "Verified", label: "Govt Data" },
  { value: "Hong Kong", label: "Launch" },
];

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="py-20 px-5 sm:px-8 relative overflow-hidden"
      style={{ background: "#555555" }}
    >
      {/* Texture overlay — repeating dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
              className="flex flex-col items-center justify-center py-12 px-8 text-center"
            >
              <span className="text-5xl sm:text-6xl font-extrabold text-white mb-2 tabular-nums leading-none">
                {value}
              </span>
              <span className="text-white/75 text-sm font-medium leading-snug max-w-[160px]">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
