"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ExpiredPage() {
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
        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ background: "#FDE8E3" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <AlertCircle size={36} style={{ color: "#A83820" }} />
        </motion.div>

        <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#555555" }}>
          Verification link expired
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#6B7280" }}>
          Links expire after 24 hours. Submit your review again to receive a new
          verification link.
        </p>

        <Link
          href="/review"
          className="px-8 py-3 rounded-full font-semibold text-sm text-white transition-colors"
          style={{ background: "#4D8B6F" }}
        >
          Submit a new review
        </Link>
      </motion.div>
    </div>
  );
}
