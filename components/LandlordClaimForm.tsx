"use client";

import { useState, useRef, useEffect } from "react";
import { Radio, Shield, CheckCircle2, Upload, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { searchAll } from "@/lib/supabase/queries";
import { setAuthReturnPath } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/client";
import type { SearchResult } from "@/lib/data/types";

interface Props {
  landlordId: string;
  landlordName: string | null;
  claimStatus: string | null;
  initialSearchQuery?: string;
}

const DOCUMENT_TYPES = [
  "Business Registration Certificate",
  "Utility bill for the property",
  "Rates notice",
  "Management agreement",
  "Other ownership document",
];

export default function LandlordClaimForm({
  landlordId: initialLandlordId,
  landlordName: initialLandlordName,
  claimStatus: initialClaimStatus,
  initialSearchQuery = "",
}: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [landlordId, setLandlordId] = useState(initialLandlordId);
  const [landlordName, setLandlordName] = useState(initialLandlordName);
  const [claimStatus, setClaimStatus] = useState(initialClaimStatus);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setLandlordId(initialLandlordId);
    setLandlordName(initialLandlordName);
    setClaimStatus(initialClaimStatus);
  }, [initialLandlordId, initialLandlordName, initialClaimStatus]);

  useEffect(() => {
    if (!initialLandlordId && initialSearchQuery.trim()) {
      setSearchQuery(initialSearchQuery.trim());
    }
  }, [initialLandlordId, initialSearchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchAll(searchQuery)
      .then(({ landlords }) => {
        if (cancelled) return;
        setSearchResults(landlords.filter((l) => l.type === "landlord").slice(0, 8));
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  function selectLandlord(result: SearchResult) {
    setLandlordId(result.id);
    setLandlordName(result.name);
    setClaimStatus("unclaimed");
    setSearchQuery("");
    setSearchResults([]);
    router.replace(`/landlord/claim?id=${result.id}`);
  }

  async function handleGoogleSignIn() {
    setAuthReturnPath(window.location.pathname + window.location.search);
    const supabase = createClient();
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // No landlord selected — show search
  if (!landlordId || !landlordName) {
    return (
      <div className="min-h-screen pt-16" style={{ background: "#F5F0E8" }}>
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          <div
            className="lg:w-[420px] lg:min-h-[calc(100vh-64px)] lg:sticky lg:top-16 flex flex-col justify-center px-10 py-14"
            style={{ background: "#555555" }}
          >
            <div className="flex items-center gap-2 mb-12">
              <Radio size={22} className="text-white" />
              <span className="text-white font-bold text-xl tracking-tight">
                Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
              Claim your landlord profile
            </h1>
            <p className="text-sm mb-8" style={{ color: "#D1D5DB" }}>
              Join verified landlords building trust with Hong Kong tenants.
            </p>
            <div className="flex flex-col gap-4 mb-10">
              {[
                "Respond publicly to tenant reviews",
                "Build your verified reputation",
                "Get discovered by quality tenants",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                    style={{ background: "#4D8B6F", color: "white" }}
                  >
                    ✓
                  </div>
                  <span className="text-sm text-white leading-snug">{point}</span>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Verification takes 1–2 business days
            </p>
          </div>

          <div className="flex-1 flex items-start justify-center px-5 sm:px-10 py-14">
            <div className="w-full max-w-lg">
              <h2 className="text-xl font-bold mb-1" style={{ color: "#555555" }}>
                Which landlord profile are you claiming?
              </h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                Search for your name or company to find your RentRadar profile.
              </p>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landlord name..."
                className="w-full px-4 py-3 rounded-[12px] text-sm outline-none mb-3"
                style={{ background: "#fff", border: "1px solid #E2D9CE", color: "#555555" }}
              />
              {searching && (
                <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Searching...</p>
              )}
              {searchResults.length > 0 && (
                <div
                  className="rounded-[12px] overflow-hidden mb-4"
                  style={{ border: "1px solid #E2D9CE", background: "#fff" }}
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => selectLandlord(result)}
                      className="w-full text-left px-4 py-3 transition-colors hover:bg-[#F5F0E8]"
                      style={{ borderBottom: "1px solid #F5F0E8" }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "#555555" }}>{result.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                        {result.district} · {result.reviewCount} reviews
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Can&apos;t find your profile?{" "}
                <Link href="/search" className="font-semibold" style={{ color: "#4D8B6F" }}>
                  Search buildings first →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Already approved
  if (claimStatus === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20" style={{ background: "#F5F0E8" }}>
        <div className="max-w-md w-full bg-white rounded-[20px] p-10 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #E2D9CE" }}>
          <CheckCircle2 size={40} style={{ color: "#4D8B6F" }} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#555555" }}>Already claimed</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B7280" }}>
            <strong>{landlordName}</strong> has already been claimed and verified.
          </p>
          <Link href={`/landlord/${landlordId}`} className="text-sm font-semibold" style={{ color: "#4D8B6F" }}>
            View profile →
          </Link>
        </div>
      </div>
    );
  }

  // Already pending
  if (claimStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20" style={{ background: "#F5F0E8" }}>
        <div className="max-w-md w-full bg-white rounded-[20px] p-10 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #E2D9CE" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl" style={{ background: "#FEF9C3" }}>
            ⏳
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#555555" }}>Claim under review</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B7280" }}>
            A claim for <strong>{landlordName}</strong> is already submitted and under review. We&apos;ll be in touch within 1–2 business days.
          </p>
          <Link href={`/landlord/${landlordId}`} className="text-sm font-semibold" style={{ color: "#4D8B6F" }}>
            Back to profile →
          </Link>
        </div>
      </div>
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setFileError("File must be under 10 MB");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(f.type)) {
      setFileError("Only PDF, JPG, or PNG files are accepted");
      return;
    }
    setFile(f);
  }

  const step1Valid = fullName.trim() !== "" && contactEmail.trim() !== "";
  const step2Valid = !!file && documentType !== "";
  const step3Valid = confirmed;

  async function handleSubmit() {
    if (!user) {
      setSubmitError("Please sign in with Google before submitting your claim.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      let documentBase64: string | undefined;
      let documentMime: string | undefined;
      let documentFilename: string | undefined;

      if (file) {
        documentBase64 = await fileToBase64(file);
        documentMime = file.type;
        documentFilename = file.name;
      }

      const res = await fetch("/api/landlord/claim/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlordId,
          fullName: fullName.trim(),
          companyName: companyName.trim() || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          documentBase64,
          documentMime,
          documentFilename,
          documentType: documentType || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20" style={{ background: "#F5F0E8" }}>
        <div className="max-w-md w-full bg-white rounded-[20px] p-10 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #E2D9CE" }}>
          <CheckCircle2 size={40} style={{ color: "#4D8B6F" }} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#555555" }}>Claim submitted!</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B7280" }}>
            We&apos;ll review your documents and respond within 1–2 business days.
            Check <strong>{contactEmail}</strong> for updates.
          </p>
          <Link href={`/landlord/${landlordId}`} className="text-sm font-semibold" style={{ color: "#4D8B6F" }}>
            Back to {landlordName} →
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: "#F5F0E8",
    border: "1px solid #E2D9CE",
    color: "#555555",
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#F5F0E8" }}>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">

        {/* ── Left panel ── */}
        <div
          className="lg:w-[420px] lg:min-h-[calc(100vh-64px)] lg:sticky lg:top-16 flex flex-col justify-center px-10 py-14"
          style={{ background: "#555555" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <Radio size={22} className="text-white" />
            <span className="text-white font-bold text-xl tracking-tight">
              Rent<span style={{ color: "#4D8B6F" }}>Radar</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
            Claim your landlord profile
          </h1>
          <p className="text-sm mb-8" style={{ color: "#D1D5DB" }}>
            Join verified landlords building trust with Hong Kong tenants.
          </p>

          <div className="flex flex-col gap-4 mb-10">
            {[
              "Respond publicly to tenant reviews",
              "Build your verified reputation",
              "Get discovered by quality tenants",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: "#4D8B6F", color: "white" }}
                >
                  ✓
                </div>
                <span className="text-sm text-white leading-snug">{point}</span>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Verification takes 1–2 business days
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-start justify-center px-5 sm:px-10 py-14">
          <div className="w-full max-w-lg">

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      background: step >= s ? "#4D8B6F" : "#E2D9CE",
                      color: step >= s ? "white" : "#9CA3AF",
                    }}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: step >= s ? "#555555" : "#9CA3AF" }}
                  >
                    {s === 1 ? "Your details" : s === 2 ? "Documents" : "Review"}
                  </span>
                  {s < 3 && (
                    <ChevronRight size={14} className="text-[#D1D5DB] hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#555555" }}>Your details</h2>
                <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
                  Tell us who you are and which profile you&apos;re claiming.
                </p>

                {!user && (
                  <div
                    className="rounded-[12px] p-4 mb-6"
                    style={{ background: "#FDE8E3", border: "1px solid #E8573A" }}
                  >
                    <p className="text-sm mb-3" style={{ color: "#A83820" }}>
                      Sign in with Google before submitting so you can access your dashboard after approval.
                    </p>
                    <button
                      type="button"
                    onClick={handleGoogleSignIn}
                      className="text-sm font-semibold px-4 py-2 rounded-[10px] text-white"
                      style={{ background: "#4D8B6F" }}
                    >
                      Sign in with Google
                    </button>
                  </div>
                )}

                {/* Claiming card */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-[12px] mb-6"
                  style={{ background: "#E4F0EB", border: "1px solid #B0D4C3" }}
                >
                  <Shield size={16} style={{ color: "#4D8B6F" }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#1F5C42" }}>Claiming profile for</p>
                    <p className="text-sm font-bold" style={{ color: "#555555" }}>{landlordName}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Full name <span style={{ color: "#E8573A" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your legal full name"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Company name <span className="text-[#9CA3AF] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Pacific Realty Holdings Ltd"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Contact email <span style={{ color: "#E8573A" }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Contact phone <span className="text-[#9CA3AF] font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+852 9XXX XXXX"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="mt-7 w-full font-semibold text-sm py-3.5 rounded-[12px] transition-all"
                  style={{
                    background: step1Valid ? "#4D8B6F" : "#D1D5DB",
                    color: step1Valid ? "white" : "#9CA3AF",
                    cursor: step1Valid ? "pointer" : "not-allowed",
                  }}
                >
                  Continue to documents →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#555555" }}>Verify ownership</h2>
                <p className="text-sm mb-2" style={{ color: "#6B7280" }}>
                  Prove you own or manage this property.
                </p>
                <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
                  Upload one of the following documents:
                </p>

                <div className="flex flex-col gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Document type <span style={{ color: "#E8573A" }}>*</span>
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                    >
                      <option value="">Select document type...</option>
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                      Upload document <span style={{ color: "#E8573A" }}>*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-[12px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                      style={{
                        border: `2px dashed ${file ? "#4D8B6F" : "#E2D9CE"}`,
                        background: file ? "#E4F0EB" : "#F5F0E8",
                      }}
                    >
                      {file ? (
                        <>
                          <CheckCircle2 size={24} style={{ color: "#4D8B6F" }} className="mb-2" />
                          <p className="text-sm font-semibold" style={{ color: "#4D8B6F" }}>
                            {file.name}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="mb-2 text-[#9CA3AF]" />
                          <p className="text-sm font-semibold" style={{ color: "#555555" }}>
                            Click to upload
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                            PDF, JPG, or PNG · Max 10 MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {fileError && (
                      <p className="text-xs mt-2" style={{ color: "#E8573A" }}>{fileError}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs mb-6 p-3 rounded-[10px]" style={{ background: "#F5F0E8", color: "#9CA3AF" }}>
                  Documents are reviewed by our team and deleted after verification.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 font-semibold text-sm py-3.5 rounded-[12px] transition-all"
                    style={{ border: "2px solid #E2D9CE", color: "#555555", background: "transparent" }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!step2Valid}
                    className="flex-1 font-semibold text-sm py-3.5 rounded-[12px] transition-all"
                    style={{
                      background: step2Valid ? "#4D8B6F" : "#D1D5DB",
                      color: step2Valid ? "white" : "#9CA3AF",
                      cursor: step2Valid ? "pointer" : "not-allowed",
                    }}
                  >
                    Review & submit →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#555555" }}>Review & submit</h2>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                  Check your details before submitting your claim.
                </p>

                <div
                  className="rounded-[14px] overflow-hidden mb-6"
                  style={{ border: "1px solid #E2D9CE" }}
                >
                  {[
                    { label: "Claiming profile", value: landlordName! },
                    { label: "Full name", value: fullName },
                    ...(companyName ? [{ label: "Company", value: companyName }] : []),
                    { label: "Contact email", value: contactEmail },
                    ...(contactPhone ? [{ label: "Contact phone", value: contactPhone }] : []),
                    { label: "Document type", value: documentType },
                    { label: "Document file", value: file?.name ?? "" },
                  ].map(({ label, value }, i, arr) => (
                    <div
                      key={label}
                      className="flex items-baseline gap-4 px-5 py-3"
                      style={{
                        background: i % 2 === 0 ? "#FAFAF9" : "white",
                        borderBottom: i < arr.length - 1 ? "1px solid #F5F0E8" : "none",
                      }}
                    >
                      <span className="text-xs font-semibold w-32 shrink-0" style={{ color: "#9CA3AF" }}>
                        {label}
                      </span>
                      <span className="text-sm flex-1 break-all" style={{ color: "#555555" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer mb-6">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                    style={{
                      background: confirmed ? "#4D8B6F" : "white",
                      border: `2px solid ${confirmed ? "#4D8B6F" : "#E2D9CE"}`,
                    }}
                    onClick={() => setConfirmed((c) => !c)}
                  >
                    {confirmed && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm leading-snug" style={{ color: "#555555" }}>
                    I confirm I am the owner or authorised manager of this property and that the information provided is accurate.
                  </span>
                </label>

                {submitError && (
                  <p
                    className="text-sm px-4 py-3 rounded-[10px] mb-4"
                    style={{ background: "#FDE8E3", color: "#A83820" }}
                  >
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 font-semibold text-sm py-3.5 rounded-[12px] transition-all"
                    style={{ border: "2px solid #E2D9CE", color: "#555555", background: "transparent" }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!step3Valid || submitting}
                    className="flex-1 font-semibold text-sm py-3.5 rounded-[12px] transition-all"
                    style={{
                      background: step3Valid && !submitting ? "#4D8B6F" : "#D1D5DB",
                      color: step3Valid && !submitting ? "white" : "#9CA3AF",
                      cursor: step3Valid && !submitting ? "pointer" : "not-allowed",
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit claim"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
