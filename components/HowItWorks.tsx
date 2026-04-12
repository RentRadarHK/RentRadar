"use client";

import { Search, BookOpen, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

type BezierTuple = [number, number, number, number];
const EASE: BezierTuple = [0.22, 1, 0.36, 1];

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Search",
    description: "Search any address, building or landlord in Hong Kong. Instant results from 51,000+ verified buildings.",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Read",
    description: "See official government data on every building — age, permits, and any statutory orders — plus verified reviews from real tenants.",
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "Know",
    description: "Go into your lease negotiation with the full picture. Know what others paid, what issues came up, and whether the landlord is worth signing with.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="py-24 px-5 sm:px-8 bg-[#F5F0E8]"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-[#4D8B6F] text-xs font-semibold uppercase tracking-widest mb-3"
          >
            Simple by design
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-bold text-[#555555]"
          >
            Everything you need before you sign
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, number, title, description }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.1, ease: EASE }}
              className="bg-white rounded-card p-8 flex flex-col gap-5 cursor-default"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              whileHover={{ y: -4, boxShadow: "0 8px 40px rgba(27, 67, 50, 0.10)" }}
            >
              {/* Top row: icon + step number */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#E4F0EB] flex items-center justify-center">
                  <Icon size={22} className="text-[#555555]" />
                </div>
                <span className="text-4xl font-extrabold text-[#555555] opacity-20 leading-none select-none">
                  {number}
                </span>
              </div>

              <div>
                <h3 className="text-[#555555] font-bold text-xl mb-2">{title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
