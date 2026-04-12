"use client";

import { useState, useEffect, useRef } from "react";
import { Radio, Menu, X, ChevronDown, LogOut, User, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import SignInModal from "@/components/auth/SignInModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Search", href: "/search" },
    { label: "About", href: "/about" },
    { label: "For Landlords & Agents", href: "#agents" },
  ];

  const initials = user?.user_metadata?.first_name
    ? (user.user_metadata.first_name as string).slice(0, 1).toUpperCase()
    : user?.email?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <>
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

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
              href="/search"
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-md"
              style={{ background: "#4D8B6F" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#3A7059")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#4D8B6F")}
            >
              Search a Landlord
            </Link>

            {/* Auth buttons */}
            {!loading && (
              <>
                {user ? (
                  /* Logged in — avatar dropdown */
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-colors"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white"
                        style={{ background: "#4D8B6F" }}
                      >
                        {initials}
                      </div>
                      <ChevronDown
                        size={13}
                        className="text-white/70 transition-transform duration-200"
                        style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 mt-2 bg-white py-1.5"
                          style={{
                            minWidth: 180,
                            borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                            border: "1px solid #E2D9CE",
                          }}
                        >
                          <div className="px-4 py-2 border-b" style={{ borderColor: "#F0EBE3" }}>
                            <p className="text-xs font-medium" style={{ color: "#555555" }}>
                              {user.user_metadata?.first_name as string | undefined ?? "Account"}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#9CA3AF", maxWidth: 160 }}>
                              {user.email}
                            </p>
                          </div>

                          <DropdownItem href="/account" icon={<User size={14} />} label="My account" onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/review" icon={<PenLine size={14} />} label="Write a review" onClick={() => setDropdownOpen(false)} />

                          <div className="my-1.5 border-t" style={{ borderColor: "#F0EBE3" }} />

                          <button
                            onClick={() => { setDropdownOpen(false); signOut(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left"
                            style={{ color: "#E8573A" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#FDE8E3")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <LogOut size={14} />
                            Sign out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Logged out — sign in / sign up */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSignInOpen(true)}
                      className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                    >
                      Sign in
                    </button>
                    <Link
                      href="/signup"
                      className="text-sm font-semibold px-4 py-2 rounded-full transition-all"
                      style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
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
                href="/search"
                onClick={() => setMenuOpen(false)}
                className="text-white text-sm font-semibold px-5 py-3 rounded-full text-center transition-colors"
                style={{ background: "#4D8B6F" }}
              >
                Search a Landlord
              </Link>

              {!loading && (
                <>
                  {user ? (
                    <>
                      <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                        <p className="text-xs text-white/50 mb-3">{user.email}</p>
                        <Link href="/account" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-white/80 hover:text-white mb-3">My account</Link>
                        <Link href="/review" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-white/80 hover:text-white mb-3">Write a review</Link>
                        <button
                          onClick={() => { setMenuOpen(false); signOut(); }}
                          className="text-sm font-medium text-left"
                          style={{ color: "#E8573A" }}
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      <button
                        onClick={() => { setMenuOpen(false); setSignInOpen(true); }}
                        className="flex-1 text-sm font-medium py-2.5 rounded-full text-center"
                        style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                      >
                        Sign in
                      </button>
                      <Link
                        href="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 text-sm font-semibold py-2.5 rounded-full text-center text-white"
                        style={{ background: "#4D8B6F" }}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function DropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
      style={{ color: "#555555" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0E8")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </Link>
  );
}
