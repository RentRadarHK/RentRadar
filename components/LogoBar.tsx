"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

const sources = [
  "Buildings Dept HKSAR",
  "Land Registry",
  "Rating & Valuation Dept",
  "data.gov.hk",
];

export default function LogoBar() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="bg-[#EDE8E3] py-10 px-5 sm:px-8 overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-8"
        >
          Properties verified against data from
        </motion.p>

        {/* Scrollable on mobile, centred on desktop */}
        <div className="flex items-center justify-start md:justify-center gap-8 overflow-x-auto no-scrollbar pb-1 flex-wrap">
          {sources.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="shrink-0"
            >
              <span className="text-[13px] font-normal text-[#9CA3AF] whitespace-nowrap select-none tracking-tight">
                {name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
