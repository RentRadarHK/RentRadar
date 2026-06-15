"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio, Check, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : signInError.message
      );
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col md:flex-row pt-16">
        <div
          className="hidden md:flex md:w-[42%] flex-col justify-center px-12 py-16"
          style={{ background: "#555555" }}
        >
          <Link href="/" className="flex items-center gap-2 mb-14 group w-fit">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Radio size={16} className="text-white" />
            </div>
            <span className="font-bold text-[18px] tracking-tight text-white">
              Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
            </span>
          </Link>

          <h1 className="font-extrabold text-[36px] leading-tight text-white mb-8">
            Welcome back.
          </h1>

          <ul className="flex flex-col gap-4 mb-10">
            {[
              "Write and manage your reviews",
              "Claim your landlord profile",
              "Access your dashboard",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(77,139,111,0.2)" }}
                >
                  <Check size={11} style={{ color: "#4D8B6F" }} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="flex-1 flex flex-col justify-center px-5 py-12 sm:px-10 md:px-16"
          style={{ background: "#FAFAF8" }}
        >
          <div className="w-full max-w-[400px] mx-auto">
            <h2 className="font-bold text-[26px] mb-1" style={{ color: "#555555" }}>
              Sign in
            </h2>
            <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold" style={{ color: "#4D8B6F" }}>
                Create one
              </Link>
            </p>

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

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "#E2D9CE" }} />
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                or continue with email
              </span>
              <div className="flex-1 h-px" style={{ background: "#E2D9CE" }} />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl mb-4"
                style={{ background: "#FDE8E3", color: "#E8573A" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
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

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "#9CA3AF" }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold text-white rounded-full transition-all mt-1 flex items-center justify-center gap-2"
                style={{
                  background: loading ? "#7FB5A0" : "#4D8B6F",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#3A7059";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#4D8B6F";
                }}
              >
                {loading && <Spinner />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function SocialButton({
  label,
  icon,
  loading,
  onClick,
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
      style={{
        border: "1.5px solid #E2D9CE",
        background: "white",
        color: "#555555",
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = "#F5F0E8";
      }}
      onMouseLeave={(e) => {
        if (!loading) e.currentTarget.style.background = "white";
      }}
    >
      {loading ? <Spinner dark /> : icon}
      {label}
    </button>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: dark ? "#555555" : "white" }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path d="M13.154 9.558c-.022-2.292 1.873-3.405 1.957-3.459-1.068-1.561-2.727-1.775-3.318-1.795-1.409-.143-2.76.835-3.474.835-.714 0-1.81-.817-2.977-.794-1.523.022-2.93.888-3.714 2.249C.02 9.12.942 13.52 2.617 15.536c.832 1.005 1.816 2.13 3.104 2.086 1.25-.048 1.72-.8 3.23-.8 1.511 0 1.944.8 3.26.778 1.346-.022 2.195-1.027 3.013-2.04.952-1.165 1.345-2.295 1.368-2.353-.03-.011-2.614-1.002-2.638-3.649ZM10.874 2.9C11.54 2.088 11.99.99 11.862-.14c-.952.042-2.103.635-2.793 1.432-.61.713-1.147 1.854-1.004 2.943 1.06.082 2.142-.538 2.809-1.335Z" fill="#1D1D1F" />
    </svg>
  );
}
