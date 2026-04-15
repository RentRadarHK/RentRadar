"use client";

import { PenLine, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

type BezierTuple = [number, number, number, number];
const EASE: BezierTuple = [0.22, 1, 0.36, 1];

export default function DualCTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="agents"
      className="py-20 px-5 sm:px-8 bg-[#F5F0E8]"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left — teal panel */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="rounded-[24px] p-12 flex flex-col justify-between gap-8 min-h-[280px]"
            style={{ background: "#4D8B6F" }}
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                Rented in Hong Kong?
              </h3>
              <p className="text-white/70 text-base leading-relaxed max-w-xs">
                Share your experience — help the next tenant make a better decision. All reviews are verified and anonymous.
              </p>
            </div>
            <a
              href="/review"
              className="inline-flex items-center gap-2 bg-white text-[#4D8B6F] font-bold text-sm px-7 py-3.5 rounded-btn hover:bg-[#F5F0E8] transition-all duration-200 self-start hover:shadow-md"
            >
              <PenLine size={16} />
              Write a Review
            </a>
          </motion.div>

          {/* Right — warm white panel */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="rounded-[24px] p-12 flex flex-col justify-between gap-8 min-h-[280px] border border-[#E2D9CE]"
            style={{ background: "#FFFFFF", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#555555] mb-3 leading-tight">
                Looking for your next rental?
              </h3>
              <p className="text-[#6B7280] text-base leading-relaxed max-w-xs">
                Search 6,611+ HK Island buildings. Read verified reviews. Know before you sign.
              </p>
            </div>
            <a
              href="/search"
              className="inline-flex items-center gap-2 bg-[#4D8B6F] hover:bg-[#3A7059] text-white font-bold text-sm px-7 py-3.5 rounded-btn transition-all duration-200 self-start hover:shadow-md"
            >
              <Search size={16} />
              Start searching
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
