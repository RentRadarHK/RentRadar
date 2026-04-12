"use client";

import { useState } from "react";
import { Radio, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/?reset=success");
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
        <h2 className="font-bold text-[22px] mb-1" style={{ color: "#555555" }}>Set new password</h2>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          Choose a strong password for your account.
        </p>

        {error && (
          <div className="text-sm px-4 py-3 rounded-xl mb-4" style={{ background: "#FDE8E3", color: "#E8573A" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 pr-11 text-sm rounded-xl outline-none transition-all"
              style={{ border: "1.5px solid #E2D9CE", background: "#FAFAFA", color: "#555555" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "#9CA3AF" }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
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
