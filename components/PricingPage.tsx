"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FEATURES = [
  "Unlimited access to all tenant reviews across 51,000+ buildings",
  "Full landlord profiles with verified review history",
  "Government building records from Buildings Department, HKSAR",
  "Statutory orders and compliance history for any building",
  "New reviews and building data updates as they happen",
];

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef as React.RefObject<Element>, { once: true, margin: "-60px" });

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <div style={{ background: "#F5F0E8" }}>

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 px-5 sm:px-8 text-center">
        <div className="max-w-[640px] mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#4D8B6F" }}
          >
            Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.06 }}
            className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5"
            style={{ color: "#555555" }}
          >
            Know before you sign.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
            className="text-lg leading-relaxed"
            style={{ color: "#6B7280" }}
          >
            One plan. Full access. Cancel any time.
          </motion.p>
        </div>
      </section>

      {/* ── Pricing card ── */}
      <section className="pb-24 px-5 sm:px-8">
        <div className="max-w-[480px] mx-auto">
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 28 }}
            animate={cardInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="bg-white rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.10)", border: "1px solid #E2D9CE" }}
          >
            {/* Card header */}
            <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #F5F0E8" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4D8B6F" }}>
                Full Access
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-extrabold" style={{ color: "#555555" }}>
                  HKD 29
                </span>
                <span className="text-base font-medium" style={{ color: "#6B7280" }}>
                  / month
                </span>
              </div>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Billed monthly. Cancel any time.
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-6" style={{ borderBottom: "1px solid #F5F0E8" }}>
              <ul className="flex flex-col gap-3.5">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#6B7280" }}>
                    <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: "#4D8B6F" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Waitlist CTA */}
            <div className="px-8 pb-8 pt-6">
              {submitted ? (
                <div
                  className="rounded-[12px] p-5 text-center"
                  style={{ background: "#E4F0EB" }}
                >
                  <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: "#555555" }} />
                  <p className="font-bold text-[#555555] mb-1">You&apos;re on the list!</p>
                  <p className="text-sm" style={{ color: "#4D8B6F" }}>
                    We&apos;ll email you as soon as payments are live.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#555555] mb-3">
                    Join the waitlist — we&apos;re launching payments soon.
                  </p>
                  <form onSubmit={handleWaitlist} className="flex flex-col gap-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 rounded-[12px] text-sm outline-none text-[#555555] placeholder:text-[#9CA3AF]"
                      style={{ border: "1.5px solid #E2D9CE", background: "#F5F0E8" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-[12px] text-white transition-colors"
                      style={{ background: "#555555" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3A7059")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#555555")}
                    >
                      Notify me when it&apos;s ready
                      <ArrowRight size={15} />
                    </button>
                  </form>
                </>
              )}
              <p className="text-xs text-center mt-4" style={{ color: "#9CA3AF" }}>
                No credit card required to join the waitlist.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
