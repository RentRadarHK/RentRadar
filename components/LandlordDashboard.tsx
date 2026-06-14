"use client";

import { useState, useMemo } from "react";
import { Star, Shield, CheckCircle2, MessageSquare, TrendingUp, User } from "lucide-react";
import { Landlord, Review } from "@/lib/data/types";
import Link from "next/link";

interface Props {
  landlord: Landlord;
  reviews: Review[];
}

function StarRating({ stars, size = 14 }: { stars: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= stars ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#D8D8D8] fill-[#D8D8D8]"}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-HK", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function LandlordDashboard({ landlord, reviews }: Props) {
  // Profile editing state
  const [bio, setBio] = useState(landlord.bio ?? "");
  const [contactEmail, setContactEmail] = useState(landlord.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(landlord.contactPhone ?? "");
  const [website, setWebsite] = useState(landlord.website ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Response state: reviewId → text
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [submittedResponses, setSubmittedResponses] = useState<Set<string>>(new Set());
  const [responseErrors, setResponseErrors] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<"profile" | "reviews" | "stats">("profile");

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = reviews.filter((r) => {
      const d = new Date(r.datePosted);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const avg = (fn: (r: Review) => number) => {
      const vals = reviews.map(fn).filter((v) => v > 0);
      if (!vals.length) return 0;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    return {
      total: reviews.length,
      avgRating: reviews.length
        ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
      thisMonth: thisMonth.length,
      depositReturn:        avg((r) => r.dimensions.depositReturn),
      responsiveness:       avg((r) => r.dimensions.landlordResponsiveness),
      listingAccuracy:      avg((r) => r.dimensions.listingAccuracy),
      wouldRentAgain:       avg((r) => r.dimensions.wouldRentAgain),
    };
  }, [reviews]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const res = await fetch("/api/landlord/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlordId: landlord.id,
          bio: bio || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          website: website || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProfileError(json.error ?? "Failed to save profile");
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitResponse(reviewId: string) {
    const text = responseTexts[reviewId] ?? "";
    if (!text.trim()) return;
    setSubmittingResponse(true);
    setResponseErrors((prev) => ({ ...prev, [reviewId]: "" }));
    try {
      const res = await fetch("/api/reviews/response/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          landlordId: landlord.id,
          responseText: text.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResponseErrors((prev) => ({ ...prev, [reviewId]: json.error ?? "Failed to submit response" }));
      } else {
        setSubmittedResponses((prev) => { const s = new Set(prev); s.add(reviewId); return s; });
        setRespondingTo(null);
      }
    } catch {
      setResponseErrors((prev) => ({ ...prev, [reviewId]: "Network error. Please try again." }));
    } finally {
      setSubmittingResponse(false);
    }
  }

  const inputStyle = {
    background: "#F5F0E8",
    border: "1px solid #E2D9CE",
    color: "#555555",
  };

  const tabStyle = (active: boolean) => ({
    background: active ? "#555555" : "white",
    color: active ? "white" : "#6B7280",
    border: active ? "none" : "1px solid #E2D9CE",
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-5 sm:px-8" style={{ background: "#F5F0E8" }}>
      <div className="max-w-[900px] mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-extrabold" style={{ color: "#555555" }}>
                  Welcome, {landlord.name}
                </h1>
                {landlord.claimStatus === "approved" && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "#E4F0EB", color: "#1F5C42", border: "1px solid #B0D4C3" }}
                  >
                    <Shield size={11} />
                    Verified Landlord
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StarRating stars={Math.round(stats.avgRating)} size={16} />
                <span className="text-sm" style={{ color: "#6B7280" }}>
                  {stats.avgRating} average · {stats.total} {stats.total === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>
            <Link
              href={`/landlord/${landlord.id}`}
              className="text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
              style={{ background: "white", color: "#4D8B6F", border: "1px solid #E2D9CE" }}
            >
              View public profile →
            </Link>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: "profile", icon: <User size={14} />, label: "Profile" },
            { key: "reviews", icon: <MessageSquare size={14} />, label: `Reviews (${reviews.length})` },
            { key: "stats",   icon: <TrendingUp size={14} />, label: "Stats" },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
              style={tabStyle(activeTab === key)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* ══════════ PROFILE TAB ══════════ */}
        {activeTab === "profile" && (
          <div
            className="bg-white rounded-[16px] p-8"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-lg font-bold mb-6" style={{ color: "#555555" }}>Your profile</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                  Bio
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "#9CA3AF" }}>
                    ({bio.length}/500 characters)
                  </span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell tenants about yourself and how you manage your properties..."
                  className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none resize-none"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                  Public contact email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@yourcompany.com"
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

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#555555" }}>
                  Website <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                />
              </div>
            </div>

            {profileError && (
              <p className="mt-4 text-sm px-4 py-3 rounded-[10px]" style={{ background: "#FDE8E3", color: "#A83820" }}>
                {profileError}
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="font-semibold text-sm px-6 py-3 rounded-[12px] transition-all"
                style={{
                  background: savingProfile ? "#D1D5DB" : "#4D8B6F",
                  color: "white",
                  cursor: savingProfile ? "not-allowed" : "pointer",
                }}
              >
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#4D8B6F" }}>
                  <CheckCircle2 size={15} />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}

        {/* ══════════ REVIEWS TAB ══════════ */}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-5">
            {reviews.length === 0 && (
              <div
                className="bg-white rounded-[16px] p-12 text-center"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              >
                <MessageSquare size={32} className="mx-auto mb-4 text-[#D1D5DB]" />
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  No reviews yet. Reviews will appear here once tenants submit them.
                </p>
              </div>
            )}

            {reviews.map((review) => {
              const hasApprovedResponse = review.response?.status === "approved";
              const hasPendingResponse = review.response?.status === "pending" || submittedResponses.has(review.id);
              const responseLength = (responseTexts[review.id] ?? "").length;

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-[16px] p-6"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <StarRating stars={review.rating} />
                      {review.buildingName && (
                        <p className="text-xs font-semibold mt-1.5" style={{ color: "#4D8B6F" }}>
                          {review.buildingName}
                          {review.buildingAddress ? ` · ${review.buildingAddress}` : ""}
                        </p>
                      )}
                      <h3 className="font-bold mt-1.5 text-[15px]" style={{ color: "#555555" }}>
                        {review.headline}
                      </h3>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "#9CA3AF" }}>
                      {formatDate(review.datePosted)}
                    </span>
                  </div>

                  {/* Review excerpts */}
                  <div className="mb-4">
                    {review.buildingDayToDay && (
                      <div className="mb-2">
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>Building day-to-day</p>
                        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3">{review.buildingDayToDay}</p>
                      </div>
                    )}
                    {review.landlordExperience && (
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#9CA3AF" }}>Landlord experience</p>
                        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3">{review.landlordExperience}</p>
                      </div>
                    )}
                    {!review.buildingDayToDay && !review.landlordExperience && (
                      <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3">{review.body}</p>
                    )}
                  </div>

                  {/* Unit/floor */}
                  {(review.unitType || review.floorNumber) && (
                    <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
                      {[review.unitType, review.floorNumber, review.unitNumber ? `Unit ${review.unitNumber}` : null]
                        .filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {/* Existing approved response */}
                  {hasApprovedResponse && review.response && (
                    <div
                      className="mt-3 p-4 rounded-[10px]"
                      style={{ borderLeft: "3px solid #4D8B6F", background: "#F5F0E8" }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#4D8B6F" }}>
                        Your response · Approved · {formatDate(review.response.createdAt)}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                        {review.response.responseText}
                      </p>
                    </div>
                  )}

                  {/* Pending submitted response */}
                  {hasPendingResponse && !hasApprovedResponse && (
                    <div
                      className="mt-3 p-4 rounded-[10px]"
                      style={{ borderLeft: "3px solid #F59E0B", background: "#FFFBEB" }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>
                        Your response · Pending review
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                        {review.response?.responseText ?? responseTexts[review.id]}
                      </p>
                    </div>
                  )}

                  {/* Respond button / expand */}
                  {!hasApprovedResponse && !hasPendingResponse && respondingTo !== review.id && (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{ color: "#4D8B6F" }}
                    >
                      <MessageSquare size={13} />
                      Respond to this review
                    </button>
                  )}

                  {/* Inline response textarea */}
                  {respondingTo === review.id && !hasApprovedResponse && !hasPendingResponse && (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold mb-2" style={{ color: "#9CA3AF" }}>
                        WRITE YOUR RESPONSE
                      </p>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={responseTexts[review.id] ?? ""}
                        onChange={(e) =>
                          setResponseTexts((prev) => ({ ...prev, [review.id]: e.target.value.slice(0, 500) }))
                        }
                        placeholder="Write a professional response to this review..."
                        className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none resize-none"
                        style={{ background: "#F5F0E8", border: "1px solid #E2D9CE", color: "#555555" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex items-center justify-between mt-1 mb-3">
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {responseLength}/500 characters
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Responses are permanent and reviewed before publishing
                        </p>
                      </div>
                      {responseErrors[review.id] && (
                        <p className="text-xs mb-3 px-3 py-2 rounded-[8px]" style={{ background: "#FDE8E3", color: "#A83820" }}>
                          {responseErrors[review.id]}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRespondingTo(null)}
                          className="text-sm font-medium px-4 py-2 rounded-[10px] transition-colors"
                          style={{ border: "1px solid #E2D9CE", color: "#6B7280", background: "white" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitResponse(review.id)}
                          disabled={submittingResponse || responseLength === 0}
                          className="text-sm font-semibold px-5 py-2 rounded-[10px] transition-all"
                          style={{
                            background: submittingResponse || responseLength === 0 ? "#D1D5DB" : "#4D8B6F",
                            color: "white",
                            cursor: submittingResponse || responseLength === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          {submittingResponse ? "Submitting..." : "Submit response"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ STATS TAB ══════════ */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-6">
            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total reviews", value: stats.total },
                { label: "Average rating", value: `${stats.avgRating} / 5` },
                { label: "This month", value: stats.thisMonth },
                { label: "Properties", value: landlord.totalProperties },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-[14px] p-5"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: "#555555" }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Rating breakdown */}
            <div
              className="bg-white rounded-[16px] p-8"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <h3 className="text-base font-bold mb-6" style={{ color: "#555555" }}>
                Rating breakdown
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Deposit return",   score: stats.depositReturn },
                  { label: "Responsiveness",   score: stats.responsiveness },
                  { label: "Listing accuracy", score: stats.listingAccuracy },
                  { label: "Would rent again", score: stats.wouldRentAgain },
                ].filter((s) => s.score > 0).map(({ label, score }) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="text-sm w-36 shrink-0" style={{ color: "#6B7280" }}>{label}</span>
                    <div
                      className="flex-1 h-2.5 rounded-full"
                      style={{ background: "#F5F0E8", position: "relative", overflow: "hidden" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: "#4D8B6F", width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right shrink-0" style={{ color: "#555555" }}>
                      {score}
                    </span>
                  </div>
                ))}
                {stats.total === 0 && (
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>
                    No reviews yet. Stats will appear here once tenants submit reviews.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
