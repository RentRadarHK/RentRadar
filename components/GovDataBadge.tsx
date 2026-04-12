"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

interface Props {
  lastUpdated: string;
  size?: "sm" | "md";
}

export default function GovDataBadge({ lastUpdated, size = "md" }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedDate = new Date(lastUpdated).toLocaleDateString("en-HK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative inline-flex">
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full cursor-default select-none transition-colors ${
          size === "sm"
            ? "text-[10px] px-2 py-0.5"
            : "text-xs px-2.5 py-1"
        }`}
        style={{ background: "#E4F0EB", color: "#1F5C42" }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <ShieldCheck size={size === "sm" ? 10 : 12} />
        Gov Data
      </span>

      {showTooltip && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 px-3 py-2 rounded-lg text-white text-xs whitespace-nowrap leading-relaxed pointer-events-none"
          style={{ background: "#555555", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
        >
          <p className="font-semibold mb-0.5">Buildings Department, HKSAR</p>
          <p style={{ color: "#D1D5DB" }}>Last updated: {formattedDate}</p>
          <div
            className="absolute top-full left-4 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #555555",
            }}
          />
        </div>
      )}
    </div>
  );
}
