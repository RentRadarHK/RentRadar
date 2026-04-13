"use client";

import { useState, useEffect } from "react";
import { Radio, Menu, X, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Search", href: "/search" },
    { label: "About", href: "/about" },
    { label: "For Landlords & Agents", href: "#agents" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "shadow-md" : ""}`}
        style={{ background: "#555555" }}
      >
        <nav className="max-w-[1200px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <Radio size={20} className="text-white relative z-10" />
              <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-200" />
            </div>
            <span className="text-white font-bold text-[17px] tracking-tight">
              Rent<span className="text-[#4D8B6F]">Radar</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-150"
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/review"
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-md flex items-center gap-2"
              style={{ background: "#4D8B6F" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#3A7059")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#4D8B6F")}
            >
              <PenLine size={14} />
              Write a Review
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden px-5 py-5 flex flex-col gap-4"
              style={{ background: "#555555", borderTop: "1px solid rgba(255,255,255,0.12)" }}
            >
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-white/80 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/review"
                onClick={() => setMenuOpen(false)}
                className="text-white text-sm font-semibold px-5 py-3 rounded-full text-center transition-colors flex items-center justify-center gap-2"
                style={{ background: "#4D8B6F" }}
              >
                <PenLine size={14} />
                Write a Review
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
