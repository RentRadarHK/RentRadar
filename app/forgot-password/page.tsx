"use client";

import { useState } from "react";
import { Radio, Mail } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F5F0E8" }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#555555" }}>
          <Radio size={14} className="text-white" />
        </div>
        <span className="font-bold text-[17px] tracking-tight" style={{ color: "#555555" }}>
          Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
        </span>
      </Link>

      <div
        className="w-full bg-white px-8 py-8"
        style={{ maxWidth: 400, borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#E4F0EB" }}>
              <Mail size={20} style={{ color: "#4D8B6F" }} />
            </div>
            <h2 className="font-bold text-xl mb-2" style={{ color: "#555555" }}>Check your email</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
              We&apos;ve sent a password reset link to <strong style={{ color: "#555555" }}>{email}</strong>.
            </p>
            <Link href="/" className="inline-block mt-5 text-sm font-semibold" style={{ color: "#4D8B6F" }}>
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-[22px] mb-1" style={{ color: "#555555" }}>Reset password</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl mb-4" style={{ background: "#FDE8E3", color: "#E8573A" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #E2D9CE", background: "#FAFAFA", color: "#555555" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold text-white rounded-full transition-all flex items-center justify-center gap-2"
                style={{ background: loading ? "#7FB5A0" : "#4D8B6F", cursor: loading ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#3A7059"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#4D8B6F"; }}
              >
                {loading && <Spinner />}
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: "#6B7280" }}>
              <Link href="/" className="font-semibold" style={{ color: "#4D8B6F" }}>
                ← Back to home
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "white" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
