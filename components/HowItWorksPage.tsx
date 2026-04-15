"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Search,
  Shield,
  Star,
  CheckCircle2,
  User,
  MessageSquare,
  BadgeCheck,
  Lock,
  Sparkles,
  ChevronDown,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" } as const,
    transition: { duration: 0.55, ease: EASE, delay },
  };
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is RentRadar free to use?",
    a: "Searching buildings and viewing government data is always free. Reading tenant reviews requires either submitting your own review first, or a small subscription.",
  },
  {
    q: "How do I know the reviews are real?",
    a: "Every reviewer must verify their identity. We use AI moderation and manual checks to detect suspicious patterns. Reviewers with document verification receive a Verified Tenant badge.",
  },
  {
    q: "Can a landlord remove a review?",
    a: "No. Landlords can respond to reviews but cannot remove them. We only remove reviews that violate our community guidelines — for example, reviews containing personal data or false statements.",
  },
  {
    q: "What is government building data?",
    a: "We pull official data directly from the Buildings Department HKSAR — including building age, occupation permit status, and any statutory orders for dangerous buildings or unauthorised building works.",
  },
  {
    q: "I'm a landlord — how do I claim my profile?",
    a: "Click 'Claim This Profile' on your landlord or building page. We'll verify your identity and ownership before granting access.",
  },
  {
    q: "Is RentRadar available outside Hong Kong?",
    a: "We're launching in Hong Kong first. Singapore and other markets will follow — sign up to be notified when we expand.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b cursor-pointer"
      style={{ borderColor: "#E2D9CE" }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between py-5 gap-4">
        <p className="text-[15px] font-semibold" style={{ color: "#555555" }}>{q}</p>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="shrink-0"
        >
          <ChevronDown size={18} style={{ color: "#9CA3AF" }} />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed" style={{ color: "#6B7280" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CtaSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  function go() {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    else router.push("/search");
  }
  return (
    <section className="py-16 px-5 sm:px-8" style={{ background: "#555555" }}>
      <div className="max-w-[620px] mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Ready to research your next rental?
        </h2>
        <p className="text-white/70 mb-7 leading-relaxed">
          Search 6,611+ HK Island buildings and verified tenant reviews — free.
        </p>
        {/* Search bar */}
        <div
          className="flex items-center bg-white rounded-full overflow-hidden mb-5"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.20)" }}
        >
          <Search size={17} className="ml-5 shrink-0" style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Search address, building or landlord..."
            className="flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-[#9CA3AF]"
            style={{ color: "#555555" }}
          />
          <button
            onClick={go}
            className="m-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ background: "#4D8B6F" }}
          >
            Search
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/review"
            className="inline-flex items-center justify-center gap-2 font-bold text-sm px-7 py-3 rounded-[12px] border border-white/30 text-white transition-colors hover:bg-white/10"
          >
            <PenLine size={14} />
            Write a Review
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  const forTenantsRef = useRef<HTMLElement>(null);
  const forLandlordsRef = useRef<HTMLElement>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const tenantInView = useInView(forTenantsRef, { once: true, margin: "-80px" });
  const landlordInView = useInView(forLandlordsRef, { once: true, margin: "-80px" });
  const verifyInView = useInView(verificationRef, { once: true, margin: "-80px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });

  const tenantSteps = [
    {
      icon: Search,
      title: "Search",
      desc: "Search any address, building name, or landlord in Hong Kong. Access our database of 6,611+ HK Island buildings instantly.",
    },
    {
      icon: Shield,
      title: "Check government data",
      desc: "Every building profile shows official data from the Buildings Department HKSAR — age, occupation permit status, and any outstanding statutory orders.",
    },
    {
      icon: Star,
      title: "Read verified reviews",
      desc: "Read what previous tenants experienced — from deposit returns to maintenance response times. Get the full picture before you view.",
    },
    {
      icon: CheckCircle2,
      title: "Decide with confidence",
      desc: "Go into your lease negotiation informed. Know what others paid per sqft, what issues arose, and what to watch out for — before you sign.",
    },
  ];

  const landlordCols = [
    {
      icon: User,
      title: "Claim your profile",
      desc: "Find your properties on RentRadar and claim your landlord profile. Free to claim, verification required.",
    },
    {
      icon: MessageSquare,
      title: "Respond to reviews",
      desc: "Respond publicly to tenant reviews. Show prospective tenants that you're professional, accountable and responsive.",
    },
    {
      icon: BadgeCheck,
      title: "Earn your verified badge",
      desc: "Build a track record of positive reviews and earn the RentRadar Verified Landlord badge — displayed prominently on all your listings and profile.",
    },
  ];

  const verifyItems = [
    {
      icon: Lock,
      title: "Identity verification",
      desc: "Every reviewer must sign in with Google or verify their email. No anonymous reviews.",
    },
    {
      icon: BadgeCheck,
      title: "Tenancy confirmation",
      desc: "Reviewers confirm when they rented and how. Optional document upload earns a Verified Tenant badge.",
    },
    {
      icon: Sparkles,
      title: "AI moderation",
      desc: "Every review is checked by our moderation system before publishing. Suspicious patterns are flagged for manual review.",
    },
  ];

  return (
    <div style={{ background: "#F5F0E8" }}>

      {/* ── A. Hero ── */}
      <section className="pt-32 pb-20 px-5 sm:px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <motion.p {...fadeUp(0)} className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#4D8B6F" }}>
            How it works
          </motion.p>
          <motion.h1 {...fadeUp(0.08)} className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5" style={{ color: "#555555" }}>
            How RentRadar works
          </motion.h1>
          <motion.p {...fadeUp(0.16)} className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            Everything you need to know before signing a lease in Hong Kong.
          </motion.p>
        </div>
      </section>

      {/* ── B. For Tenants — vertical timeline ── */}
      <section ref={forTenantsRef} className="py-20 px-5 sm:px-8" style={{ background: "#F5F0E8" }}>
        <div className="max-w-[760px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={tenantInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4D8B6F" }}
          >
            For tenants
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={tenantInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-extrabold mb-14" style={{ color: "#555555" }}
          >
            Know before you sign
          </motion.h2>

          <div className="relative flex flex-col gap-0">
            {/* Vertical line */}
            <div
              className="absolute left-[19px] top-10 bottom-10 w-[2px]"
              style={{ background: "#E2D9CE" }}
            />

            {tenantSteps.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                animate={tenantInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: EASE }}
                className="flex gap-6 pb-10 relative"
              >
                {/* Step dot */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10"
                  style={{ background: "#555555" }}
                >
                  <Icon size={17} className="text-white" />
                </div>
                <div className="pt-1.5">
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#555555" }}>
                    <span className="text-sm font-semibold mr-2" style={{ color: "#9CA3AF" }}>0{i + 1}</span>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── C. For Landlords ── */}
      <section ref={forLandlordsRef} className="py-20 px-5 sm:px-8" style={{ background: "#E4F0EB" }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={landlordInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4D8B6F" }}
          >
            For landlords &amp; agents
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={landlordInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-extrabold mb-14" style={{ color: "#555555" }}
          >
            Build the reputation you deserve
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landlordCols.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                animate={landlordInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: EASE }}
                className="bg-white rounded-[16px] p-7 flex flex-col gap-4"
                style={{ border: "0.5px solid #B0D4C3" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#E4F0EB" }}>
                  <Icon size={20} style={{ color: "#555555" }} />
                </div>
                <h3 className="font-bold text-[17px]" style={{ color: "#555555" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── D. Verification ── */}
      <div ref={verificationRef} className="py-20 px-5 sm:px-8" style={{ background: "#F5F0E8" }}>
        <div className="max-w-[900px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={verifyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="bg-white rounded-[24px] p-10 sm:p-14 text-center"
            style={{ border: "0.5px solid #E2D9CE" }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "#555555" }}>
              How we verify reviews
            </h2>
            <p className="text-base mb-12 max-w-md mx-auto leading-relaxed" style={{ color: "#6B7280" }}>
              Fake reviews destroy trust. Here&apos;s how we keep RentRadar credible.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {verifyItems.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={verifyInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.1, ease: EASE }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#E4F0EB" }}>
                    <Icon size={22} style={{ color: "#555555" }} />
                  </div>
                  <h3 className="font-bold text-[15px]" style={{ color: "#555555" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── E. FAQ ── */}
      <div ref={faqRef} className="py-20 px-5 sm:px-8">
        <div className="max-w-[720px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-2xl sm:text-3xl font-extrabold mb-10" style={{ color: "#555555" }}
          >
            Frequently asked questions
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={faqInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {faqs.map((item) => (
              <FAQItem key={item.q} {...item} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── F. CTA ── */}
      <CtaSearch />
    </div>
  );
}
