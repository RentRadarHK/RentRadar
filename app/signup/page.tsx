"use client";

import { useState } from "react";
import { Radio, Check, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SignInModal from "@/components/auth/SignInModal";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const supabase = createClient();

  function getStrength(pw: string): { label: string; color: string; width: string } {
    if (pw.length === 0) return { label: "", color: "#E2D9CE", width: "0%" };
    if (pw.length < 8) return { label: "Weak", color: "#E8573A", width: "33%" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score >= 2) return { label: "Strong", color: "#4D8B6F", width: "100%" };
    return { label: "Fair", color: "#F59E0B", width: "66%" };
  }

  const strength = getStrength(password);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms of Service and Privacy Policy."); return; }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setConfirmed(true);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F0E8" }}>
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#E4F0EB" }}>
            <Mail size={24} style={{ color: "#4D8B6F" }} />
          </div>
          <h2 className="font-bold text-2xl mb-2" style={{ color: "#555555" }}>Check your email</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            We&apos;ve sent a verification link to <strong style={{ color: "#555555" }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-sm font-semibold"
            style={{ color: "#4D8B6F" }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left column */}
        <div
          className="hidden md:flex md:w-[42%] flex-col justify-center px-12 py-16"
          style={{ background: "#555555" }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-14 group w-fit">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Radio size={16} className="text-white" />
            </div>
            <span className="font-bold text-[18px] tracking-tight text-white">
              Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
            </span>
          </Link>

          <h1 className="font-extrabold text-[36px] leading-tight text-white mb-8">
            Know before<br />you sign.
          </h1>

          <ul className="flex flex-col gap-4 mb-10">
            {[
              "Search 6,611+ HK Island buildings",
              "Read real tenant reviews",
              "Spot red flags before you commit",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(77,139,111,0.2)" }}>
                  <Check size={11} style={{ color: "#4D8B6F" }} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-white/90">{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Free to join. No credit card required.
          </p>
        </div>

        {/* Right column */}
        <div
          className="flex-1 flex flex-col justify-center px-5 py-12 sm:px-10 md:px-16"
          style={{ background: "#FAFAF8" }}
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#555555" }}>
              <Radio size={14} className="text-white" />
            </div>
            <span className="font-bold text-[17px] tracking-tight" style={{ color: "#555555" }}>
              Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
            </span>
          </Link>

          <div className="w-full max-w-[400px] mx-auto">
            <h2 className="font-bold text-[26px] mb-1" style={{ color: "#555555" }}>
              Create your account
            </h2>
            <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
              Already have an account?{" "}
              <button
                onClick={() => setSignInOpen(true)}
                className="font-semibold transition-colors"
                style={{ color: "#4D8B6F" }}
              >
                Sign in
              </button>
            </p>

            {/* Social */}
            <div className="flex flex-col gap-2.5 mb-5">
              <SocialButton
                label="Continue with Google"
                icon={<GoogleIcon />}
                loading={oauthLoading === "google"}
                onClick={() => handleOAuth("google")}
              />
              <SocialButton
                label="Continue with Apple"
                icon={<AppleIcon />}
                loading={oauthLoading === "apple"}
                onClick={() => handleOAuth("apple")}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "#E2D9CE" }} />
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>or sign up with email</span>
              <div className="flex-1 h-px" style={{ background: "#E2D9CE" }} />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl mb-4" style={{ background: "#FDE8E3", color: "#E8573A" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #E2D9CE", background: "white", color: "#555555" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
              />

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #E2D9CE", background: "white", color: "#555555" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
              />

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 text-sm rounded-xl outline-none transition-all"
                    style={{ border: "1.5px solid #E2D9CE", background: "white", color: "#555555" }}
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
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#E2D9CE" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color, minWidth: 36 }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-1">
                <div
                  className="relative mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    border: `1.5px solid ${agreed ? "#4D8B6F" : "#E2D9CE"}`,
                    background: agreed ? "#4D8B6F" : "white",
                  }}
                  onClick={() => setAgreed(!agreed)}
                >
                  {agreed && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm leading-snug" style={{ color: "#6B7280" }}>
                  I agree to the{" "}
                  <a href="/terms" className="underline" style={{ color: "#555555" }}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="underline" style={{ color: "#555555" }}>Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold text-white rounded-full transition-all mt-1 flex items-center justify-center gap-2"
                style={{
                  background: loading ? "#7FB5A0" : "#4D8B6F",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#3A7059"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#4D8B6F"; }}
              >
                {loading && <Spinner />}
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function SocialButton({
  label, icon, loading, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium rounded-full transition-all"
      style={{ border: "1.5px solid #E2D9CE", background: "white", color: "#555555", cursor: loading ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#F5F0E8"; }}
      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "white"; }}
    >
      {loading ? <Spinner dark /> : icon}
      {label}
    </button>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: dark ? "#555555" : "white" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path d="M13.154 9.558c-.022-2.292 1.873-3.405 1.957-3.459-1.068-1.561-2.727-1.775-3.318-1.795-1.409-.143-2.76.835-3.474.835-.714 0-1.81-.817-2.977-.794-1.523.022-2.93.888-3.714 2.249C.02 9.12.942 13.52 2.617 15.536c.832 1.005 1.816 2.13 3.104 2.086 1.25-.048 1.72-.8 3.23-.8 1.511 0 1.944.8 3.26.778 1.346-.022 2.195-1.027 3.013-2.04.952-1.165 1.345-2.295 1.368-2.353-.03-.011-2.614-1.002-2.638-3.649ZM10.874 2.9C11.54 2.088 11.99.99 11.862-.14c-.952.042-2.103.635-2.793 1.432-.61.713-1.147 1.854-1.004 2.943 1.06.082 2.142-.538 2.809-1.335Z" fill="#1D1D1F"/>
    </svg>
  );
}
