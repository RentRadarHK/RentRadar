"use client";

import { useEffect, useRef } from "react";

const stats = [
  { value: "4,200+", label: "Verified Reviews" },
  { value: "1,800+", label: "Properties Rated" },
  { value: "12+", label: "Landlord Red Flags Identified Daily" },
];

export default function StatBar() {
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
      className="fade-in-section py-6 px-5 sm:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div
          className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-2xl overflow-hidden"
          style={{
            background: "#555555",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-10 px-8 text-center group hover:bg-white/5 transition-colors duration-200"
            >
              <span className="text-4xl sm:text-5xl font-black text-white mb-2 tabular-nums">
                {value}
              </span>
              <span className="text-white/70 text-sm font-medium leading-snug max-w-[140px]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
