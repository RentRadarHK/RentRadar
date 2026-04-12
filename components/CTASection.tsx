"use client";

import { PenLine, Search } from "lucide-react";
import { useEffect, useRef } from "react";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="fade-in-section py-28 px-5 sm:px-8"
    >
      <div className="max-w-3xl mx-auto text-center relative">
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(77,139,111,0.08) 0%, transparent 70%)",
          }}
        />

        <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
          Had a bad landlord experience?
        </h2>
        <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Your review could save someone else from the same mistake.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ background: "#4D8B6F" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3A7059")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#4D8B6F")}
          >
            <PenLine size={16} />
            Write a Review
          </a>
          <a
            href="#search"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-colors"
            style={{ border: "1.5px solid rgba(255,255,255,0.5)", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Search size={16} />
            Search First
          </a>
        </div>
      </div>
    </section>
  );
}
