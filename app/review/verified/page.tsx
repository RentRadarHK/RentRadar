"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function VerifiedContent() {
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") ?? "/search";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F5F0E8" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        {/* Animated checkmark */}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ background: "#E4F0EB" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <motion.path
              d="M10 21 L17 28 L30 13"
              stroke="#4D8B6F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
            />
          </svg>
        </motion.div>

        <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#555555" }}>
          Review verified!
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#6B7280" }}>
          Your review is now pending moderation and will appear within 24 hours.
        </p>

        <Link
          href={backHref}
          className="px-8 py-3 rounded-full font-semibold text-sm text-white transition-colors"
          style={{ background: "#4D8B6F" }}
        >
          Back to profile
        </Link>
      </motion.div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F5F0E8" }} />}>
      <VerifiedContent />
    </Suspense>
  );
}
