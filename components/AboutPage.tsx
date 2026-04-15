"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Shield,
  Star,
  Scale,
  Database,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" } as const,
    transition: { duration: 0.55, ease: EASE, delay },
  };
}

export default function AboutPage() {
  const problemRef = useRef<HTMLElement>(null);
  const whatRef = useRef<HTMLElement>(null);
  const principlesRef = useRef<HTMLElement>(null);
  const teamRef = useRef<HTMLElement>(null);

  const problemInView = useInView(problemRef, { once: true, margin: "-80px" });
  const whatInView = useInView(whatRef, { once: true, margin: "-80px" });
  const principlesInView = useInView(principlesRef, { once: true, margin: "-80px" });
  const teamInView = useInView(teamRef, { once: true, margin: "-80px" });

  const whatCards = [
    {
      icon: Shield,
      title: "Government data",
      desc: "We pull official building data from the Buildings Department HKSAR — age, permits, statutory orders — and make it searchable for the first time in one place.",
    },
    {
      icon: Star,
      title: "Verified reviews",
      desc: "Verified tenant reviews, tied to property addresses — not just landlord names. The building has a history even if the landlord hides behind an agent.",
    },
    {
      icon: Scale,
      title: "Landlord accountability",
      desc: "Good landlords earn recognition. Bad ones are held accountable. We give both sides of the market the transparency they deserve.",
    },
  ];

  const principles = [
    {
      icon: CheckCircle2,
      title: "Review integrity above everything",
      desc: "Landlords can respond to reviews and claim their profiles. They can never pay to remove or suppress a review. Our data is not for sale.",
    },
    {
      icon: Shield,
      title: "Verified, not anonymous",
      desc: "Every reviewer must verify their identity. Reviews are anonymous to the public but accountable to us. This keeps the platform credible and legally defensible.",
    },
    {
      icon: Scale,
      title: "Balanced, not adversarial",
      desc: "We're not an anti-landlord platform. We believe most landlords are decent people who want to do right by their tenants. RentRadar helps the good ones stand out.",
    },
    {
      icon: Database,
      title: "Data transparency",
      desc: "Our government data comes directly from the Buildings Department HKSAR. We show our sources, update regularly, and welcome corrections when we get something wrong.",
    },
  ];

  return (
    <div style={{ background: "#F5F0E8" }}>

      {/* ── A. Hero ── */}
      <section className="pt-32 pb-20 px-5 sm:px-8">
        <div className="max-w-[760px] mx-auto">
          <motion.p {...fadeUp(0)} className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#4D8B6F" }}>
            About RentRadar
          </motion.p>
          <motion.h1 {...fadeUp(0.08)} className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6" style={{ color: "#555555" }}>
            Built for a fairer rental market
          </motion.h1>
          <motion.p {...fadeUp(0.16)} className="text-lg leading-relaxed max-w-xl" style={{ color: "#6B7280" }}>
            RentRadar started with a simple observation: landlords know everything about their tenants.
            Tenants know almost nothing about their landlords. We&apos;re changing that.
          </motion.p>
        </div>
      </section>

      {/* ── B. The Problem ── */}
      <section ref={problemRef} className="py-20 px-5 sm:px-8 border-t" style={{ borderColor: "#E2D9CE" }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.p
            initial={{ opacity: 0 }} animate={problemInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest mb-12" style={{ color: "#4D8B6F" }}
          >
            Why we exist
          </motion.p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Pull quote */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
            >
              <blockquote
                className="text-2xl sm:text-3xl font-extrabold leading-snug"
                style={{ color: "#555555" }}
              >
                &ldquo;In Hong Kong, a tenant signs a 2-year lease worth HKD 500,000+ with almost no information about who they&apos;re signing with.&rdquo;
              </blockquote>
            </motion.div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
              className="flex flex-col gap-5 text-[15px] leading-relaxed"
              style={{ color: "#6B7280" }}
            >
              <p>
                Landlords require credit checks, employment letters, tax returns and references before considering a tenant. But a tenant has almost no equivalent way to research a property before committing to it — until now.
              </p>
              <p>
                Horror stories are scattered across Facebook groups and expat forums, but they disappear into noise. There&apos;s no structured, searchable, persistent record of landlord behaviour. A landlord who mistreats ten tenants over five years faces zero cumulative accountability.
              </p>
              <p className="font-semibold" style={{ color: "#555555" }}>
                RentRadar fixes this.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── C. What We Do ── */}
      <section ref={whatRef} className="py-20 px-5 sm:px-8" style={{ background: "#fff", borderTop: "0.5px solid #E2D9CE" }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={whatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4D8B6F" }}
          >
            What we do
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={whatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-extrabold mb-12" style={{ color: "#555555" }}
          >
            Three things that make the difference
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whatCards.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: EASE }}
                className="rounded-[16px] p-7 flex flex-col gap-4"
                style={{ background: "#F5F0E8" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#E4F0EB" }}>
                  <Icon size={20} style={{ color: "#555555" }} />
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#555555" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── D. Our Principles ── */}
      <section ref={principlesRef} className="py-20 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={principlesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4D8B6F" }}
          >
            How we operate
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={principlesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-extrabold mb-12" style={{ color: "#555555" }}
          >
            What we stand for
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {principles.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={principlesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 + i * 0.09, ease: EASE }}
                className="bg-white rounded-[16px] p-7 flex gap-5"
                style={{ border: "0.5px solid #E2D9CE" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E4F0EB" }}>
                  <Icon size={19} style={{ color: "#555555" }} />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ color: "#555555" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── E. Team ── */}
      <section ref={teamRef} className="py-20 px-5 sm:px-8 border-t" style={{ borderColor: "#E2D9CE" }}>
        <div className="max-w-[640px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4D8B6F" }}
          >
            Who we are
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl font-extrabold mb-6" style={{ color: "#555555" }}
          >
            A small team building something important
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={teamInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[15px] leading-relaxed mb-6" style={{ color: "#6B7280" }}
          >
            RentRadar is an early-stage platform built by a small team who believe tenants deserve better information. We&apos;re growing — if this mission resonates with you, we&apos;d love to hear from you.
          </motion.p>
          <motion.a
            initial={{ opacity: 0 }} animate={teamInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.22 }}
            href="mailto:hello@rentradar.co"
            className="text-sm font-semibold transition-colors hover:underline"
            style={{ color: "#4D8B6F" }}
          >
            hello@rentradar.co →
          </motion.a>
        </div>
      </section>

      {/* ── F. CTA ── */}
      <section className="py-16 px-5 sm:px-8" style={{ background: "#555555" }}>
        <div className="max-w-[560px] mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Ready to search your landlord?
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            6,611+ HK Island buildings, verified government data, and honest tenant reviews.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-white font-bold text-sm px-8 py-3.5 rounded-[12px] transition-colors hover:bg-[#F5F0E8]"
            style={{ color: "#555555" }}
          >
            <Search size={15} />
            Search a Landlord
          </Link>
        </div>
      </section>
    </div>
  );
}
