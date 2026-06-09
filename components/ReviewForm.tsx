"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  User,
  MapPin,
  Shield,
  Star,
  Lock,
  Check,
  AlertCircle,
  Upload,
  Mail,
  X,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { SearchResult } from "@/lib/data/types";
import { searchAll, getBuilding, getLandlord } from "@/lib/supabase/queries";
import { setAuthReturnPath } from "@/lib/auth/return-path";
import { useAuth } from "@/lib/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);
const STAR_LABELS = ["", "Very poor", "Poor", "Average", "Good", "Excellent"];
const REVIEW_DRAFT_KEY = "rr_review_draft";

type Step = 1 | 2 | 3 | 4;
type VerifyMethod = "google" | "email" | "document" | null;
type RentMethod = "direct" | "agent" | "corporate" | null;
type UnitType = "studio" | "1bed" | "2bed" | "3bed" | "4bed+" | "";

interface SelectedProperty {
  type: "building" | "landlord";
  id: string;
  name: string;
  address?: string;
  district: string;
  market: string;
  rating: number;
  reviewCount: number;
  badge?: string;
}

// ── Star Picker ───────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          whileTap={{ scale: 1.35 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            size={size}
            className={
              i <= (hover || value)
                ? "text-[#F59E0B] fill-[#F59E0B]"
                : "text-[#D8D8D8] fill-[#D8D8D8]"
            }
          />
        </motion.button>
      ))}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Property" },
    { n: 2, label: "Tenancy" },
    { n: 3, label: "Ratings" },
    { n: 4, label: "Story" },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, idx) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="relative flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: 32,
                  height: 32,
                  background: done || active ? "#555555" : "#E2D9CE",
                  boxShadow: active ? "0 0 0 4px #E4F0EB" : "none",
                }}
              >
                {done ? (
                  <Check size={14} className="text-white" />
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: active ? "#fff" : "#9CA3AF" }}
                  >
                    {s.n}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold hidden sm:block"
                style={{ color: active || done ? "#555555" : "#9CA3AF" }}
              >
                {s.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden"
                style={{ background: "#E2D9CE", marginBottom: "18px" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "#555555" }}
                  initial={{ width: "0%" }}
                  animate={{ width: step > s.n ? "100%" : "0%" }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[14px] shadow-lg"
      style={{
        transform: "translateX(-50%)",
        background: "#555555",
        color: "#fff",
        maxWidth: "90vw",
      }}
    >
      <AlertCircle size={16} className="shrink-0 text-red-400" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2">
        <X size={14} className="text-white/60 hover:text-white" />
      </button>
    </motion.div>
  );
}

// ── Context Panel ─────────────────────────────────────────────────────────────

function ContextPanel({ selectedProperty }: { selectedProperty: SelectedProperty | null }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "#555555" }}
          >
            <Star size={14} className="text-white fill-white" />
          </div>
          <span className="font-extrabold text-sm" style={{ color: "#555555" }}>
            RentRadar
          </span>
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: "#555555" }}>
          Write a Review
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Help future tenants make better decisions.
        </p>
      </div>

      {/* Selected property card */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-[16px] bg-white p-5"
            style={{ border: "0.5px solid #E2D9CE" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#E4F0EB" }}
              >
                {selectedProperty.type === "building" ? (
                  <Building2 size={18} style={{ color: "#555555" }} />
                ) : (
                  <User size={18} style={{ color: "#555555" }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[15px] leading-snug" style={{ color: "#555555" }}>
                  {selectedProperty.name}
                </p>
                {selectedProperty.address && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                    <MapPin size={10} />
                    {selectedProperty.address}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i <= Math.round(selectedProperty.rating)
                            ? "text-[#F59E0B] fill-[#F59E0B]"
                            : "text-[#D8D8D8] fill-[#D8D8D8]"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#555555" }}>
                    {selectedProperty.rating.toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    · {selectedProperty.reviewCount} reviews
                  </span>
                  {selectedProperty.badge && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#E4F0EB", color: "#1F5C42" }}
                    >
                      {selectedProperty.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Why your review matters */}
      <div
        className="rounded-[16px] bg-white p-5"
        style={{ border: "0.5px solid #E2D9CE" }}
      >
        <h3 className="font-bold text-sm mb-4" style={{ color: "#555555" }}>
          Why your review matters
        </h3>
        <div className="flex flex-col gap-4">
          {[
            {
              icon: <Shield size={16} style={{ color: "#555555" }} />,
              text: "Protects future tenants from bad experiences",
            },
            {
              icon: <Star size={16} style={{ color: "#555555" }} />,
              text: "Rewards good landlords with visibility",
            },
            {
              icon: <Lock size={16} style={{ color: "#4D8B6F" }} />,
              text: "Your identity is never shown publicly",
            },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#E4F0EB" }}
              >
                {icon}
              </div>
              <p className="text-sm leading-snug pt-0.5" style={{ color: "#6B7280" }}>
                {text}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4 pt-4 border-t" style={{ borderColor: "#F0EDE8", color: "#9CA3AF" }}>
          Reviews are moderated within 24 hours
        </p>
      </div>
    </div>
  );
}

// ── Success State ─────────────────────────────────────────────────────────────

function SuccessState({
  selectedProperty,
  docVerified,
  onReset,
}: {
  selectedProperty: SelectedProperty | null;
  docVerified: boolean;
  onReset: () => void;
}) {
  const profileHref = selectedProperty
    ? `/${selectedProperty.type}/${selectedProperty.id}`
    : "/search";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center text-center py-16 px-6"
    >
      {/* Animated circle + checkmark */}
      <div className="relative mb-8">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "#E4F0EB" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <motion.path
              d="M10 21 L17 28 L30 13"
              stroke="#555555"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
            />
          </svg>
        </motion.div>
      </div>

      <h2 className="text-xl font-extrabold mb-3" style={{ color: "#555555" }}>
        Review submitted
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: "#6B7280" }}>
        Thank you. Your experience will help protect the next tenant. It will appear on the profile
        within 24 hours after our quick moderation check.
      </p>

      {docVerified && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full mb-6 text-sm font-semibold"
          style={{ background: "#E4F0EB", color: "#1F5C42" }}
        >
          <Check size={14} />
          Document verification pending manual review
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href={profileHref}
          className="flex-1 text-center py-3 rounded-[12px] text-sm font-semibold border transition-colors"
          style={{ borderColor: "#555555", color: "#555555" }}
        >
          View the profile
        </Link>
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-[12px] text-sm font-semibold transition-colors"
          style={{ color: "#6B7280" }}
        >
          Write another review
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReviewForm() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Step
  const [step, setStep] = useState<Step>(1);

  // Step 1 — property search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Step 2 — tenancy
  const [fromYear, setFromYear] = useState<number | "">( "");
  const [toYear, setToYear] = useState<number | "current" | "">("current");
  const [rentMethod, setRentMethod] = useState<RentMethod>(null);
  const [stillRenting, setStillRenting] = useState<boolean | null>(null);
  const [unitType, setUnitType] = useState<UnitType>("");
  const [floorNumber, setFloorNumber] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [landlordName, setLandlordName] = useState("");

  // Step 3 — ratings
  const [overallRating, setOverallRating] = useState(0);
  // Building ratings
  const [ratingMaintenance, setRatingMaintenance] = useState(0);
  const [ratingCleanliness, setRatingCleanliness] = useState(0);
  const [ratingPestControl, setRatingPestControl] = useState(0);
  const [ratingNoise, setRatingNoise] = useState(0);
  const [ratingFacilities, setRatingFacilities] = useState(0);
  const [ratingBuildingMgmt, setRatingBuildingMgmt] = useState(0);
  // Flat ratings
  const [ratingFlatCondition, setRatingFlatCondition] = useState(0);
  const [ratingFlatCleanliness, setRatingFlatCleanliness] = useState(0);
  const [ratingFlatLayout, setRatingFlatLayout] = useState(0);
  const [ratingFlatLight, setRatingFlatLight] = useState(0);
  const [ratingFlatRepairs, setRatingFlatRepairs] = useState(0);
  // Landlord ratings
  const [ratingDepositReturn, setRatingDepositReturn] = useState(0);
  const [ratingListingAccuracy, setRatingListingAccuracy] = useState(0);
  const [ratingLandlordResponsiveness, setRatingLandlordResponsiveness] = useState(0);
  const [ratingWouldRentAgain, setRatingWouldRentAgain] = useState(0);

  // Step 4 — guided review + verify
  const [buildingDayToDay, setBuildingDayToDay] = useState("");
  const [buildingIssues, setBuildingIssues] = useState("");
  const [flatDayToDay, setFlatDayToDay] = useState("");
  const [flatIssues, setFlatIssues] = useState("");
  const [landlordExperience, setLandlordExperience] = useState("");
  const [landlordDeposit, setLandlordDeposit] = useState("");
  const [landlordRentAgain, setLandlordRentAgain] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [flatSize, setFlatSize] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>(null);
  const [verifyEmail, setVerifyEmail] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Prefill from query params ──────────────────────────────────────────────

  useEffect(() => {
    const buildingId = searchParams?.get("building");
    const landlordId = searchParams?.get("landlord");

    if (buildingId) {
      getBuilding(buildingId).then((b) => {
        if (b) {
          setSelectedProperty({
            type: "building",
            id: b.id,
            name: b.name,
            address: b.address,
            district: b.district,
            market: b.market,
            rating: b.avgRating,
            reviewCount: b.totalReviews,
          });
        }
      });
    } else if (landlordId) {
      getLandlord(landlordId).then((l) => {
        if (l) {
          setSelectedProperty({
            type: "landlord",
            id: l.id,
            name: l.name,
            address: undefined,
            district: l.activeMarkets[0] ?? "Hong Kong",
            market: l.activeMarkets[0] ?? "Hong Kong",
            rating: l.avgRating,
            reviewCount: l.totalReviews,
            badge: l.verified ? "Verified" : undefined,
          });
        }
      });
    }
  }, [searchParams]);

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    searchAll(searchQuery).then(({ buildings, landlords }) => {
      if (cancelled) return;
      const combined: SearchResult[] = [...buildings, ...landlords].slice(0, 10);
      setSearchResults(combined);
      setShowDropdown(combined.length > 0);
    });
    return () => { cancelled = true; };
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Restore draft after Google OAuth return ────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem(REVIEW_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      const currentBuildingId = searchParams?.get("building");
      const currentLandlordId = searchParams?.get("landlord");
      if (
        (currentBuildingId && draft.buildingId !== currentBuildingId) ||
        (currentLandlordId && draft.landlordId !== currentLandlordId)
      ) {
        sessionStorage.removeItem(REVIEW_DRAFT_KEY);
        return;
      }
      if (draft.selectedProperty) setSelectedProperty(draft.selectedProperty);
      if (draft.fromYear !== undefined) setFromYear(draft.fromYear);
      if (draft.toYear !== undefined) setToYear(draft.toYear);
      if (draft.rentMethod !== undefined) setRentMethod(draft.rentMethod);
      if (draft.stillRenting !== undefined) setStillRenting(draft.stillRenting);
      if (draft.unitType) setUnitType(draft.unitType);
      if (draft.floorNumber) setFloorNumber(draft.floorNumber);
      if (draft.unitNumber) setUnitNumber(draft.unitNumber);
      if (draft.landlordName) setLandlordName(draft.landlordName);
      if (draft.overallRating) setOverallRating(draft.overallRating);
      if (draft.ratingMaintenance) setRatingMaintenance(draft.ratingMaintenance);
      if (draft.ratingCleanliness) setRatingCleanliness(draft.ratingCleanliness);
      if (draft.ratingPestControl) setRatingPestControl(draft.ratingPestControl);
      if (draft.ratingNoise) setRatingNoise(draft.ratingNoise);
      if (draft.ratingFacilities) setRatingFacilities(draft.ratingFacilities);
      if (draft.ratingBuildingMgmt) setRatingBuildingMgmt(draft.ratingBuildingMgmt);
      if (draft.ratingFlatCondition) setRatingFlatCondition(draft.ratingFlatCondition);
      if (draft.ratingFlatCleanliness) setRatingFlatCleanliness(draft.ratingFlatCleanliness);
      if (draft.ratingFlatLayout) setRatingFlatLayout(draft.ratingFlatLayout);
      if (draft.ratingFlatLight) setRatingFlatLight(draft.ratingFlatLight);
      if (draft.ratingFlatRepairs) setRatingFlatRepairs(draft.ratingFlatRepairs);
      if (draft.ratingDepositReturn) setRatingDepositReturn(draft.ratingDepositReturn);
      if (draft.ratingListingAccuracy) setRatingListingAccuracy(draft.ratingListingAccuracy);
      if (draft.ratingLandlordResponsiveness) setRatingLandlordResponsiveness(draft.ratingLandlordResponsiveness);
      if (draft.ratingWouldRentAgain) setRatingWouldRentAgain(draft.ratingWouldRentAgain);
      if (draft.buildingDayToDay) setBuildingDayToDay(draft.buildingDayToDay);
      if (draft.buildingIssues) setBuildingIssues(draft.buildingIssues);
      if (draft.flatDayToDay) setFlatDayToDay(draft.flatDayToDay);
      if (draft.flatIssues) setFlatIssues(draft.flatIssues);
      if (draft.landlordExperience) setLandlordExperience(draft.landlordExperience);
      if (draft.landlordDeposit) setLandlordDeposit(draft.landlordDeposit);
      if (draft.landlordRentAgain) setLandlordRentAgain(draft.landlordRentAgain);
      if (draft.monthlyRent) setMonthlyRent(draft.monthlyRent);
      if (draft.flatSize) setFlatSize(draft.flatSize);
      if (draft.confirmChecked) setConfirmChecked(draft.confirmChecked);
      if (draft.verifyMethod) setVerifyMethod(draft.verifyMethod);
      else setVerifyMethod("google");
      if (draft.verifyEmail) setVerifyEmail(draft.verifyEmail);
      setStep(4);
      if (draft.verifyMethod === "google" || !draft.verifyMethod) {
        setToast("Signed in with Google. You can now submit your review.");
      }
    } catch {
      // malformed draft — ignore
    } finally {
      sessionStorage.removeItem(REVIEW_DRAFT_KEY);
    }
  }, [user, searchParams]);

  function selectProperty(r: SearchResult) {
    setSelectedProperty({
      type: r.type,
      id: r.id,
      name: r.name,
      address: r.address,
      district: r.district,
      market: r.market,
      rating: r.rating,
      reviewCount: r.reviewCount,
      badge: r.badge,
    });
    setSearchQuery("");
    setShowDropdown(false);
  }

  // ── Word count ─────────────────────────────────────────────────────────────

  function wc(text: string): number {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedProperty) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // ── Google verification: trigger OAuth if not signed in ────────────────
      if (verifyMethod === "google" && !user) {
        const returnPath = prepareGoogleAuth();
        const next = encodeURIComponent(returnPath);
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
        });
        // Page will reload after OAuth — stop here
        return;
      }

      const buildingId =
        selectedProperty.type === "building" ? selectedProperty.id : undefined;
      const landlordId =
        selectedProperty.type === "landlord" ? selectedProperty.id : undefined;

      // Minimum 1.5 s loading UX
      await new Promise((r) => setTimeout(r, 1500));

      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          building_id:           buildingId,
          landlord_id:           landlordId,
          tenancy_from:          fromYear !== "" ? Number(fromYear) : undefined,
          tenancy_to:            toYear === "current" || toYear === "" ? undefined : Number(toYear),
          currently_renting:     toYear === "current" || stillRenting === true,
          rental_method:         rentMethod,
          unit_type:             unitType || undefined,
          floor_number:          floorNumber || undefined,
          unit_number:           unitNumber || undefined,
          landlord_name:         landlordName || undefined,
          rating_overall:                   overallRating,
          rating_maintenance:               ratingMaintenance,
          rating_cleanliness:               ratingCleanliness,
          rating_pest_control:              ratingPestControl,
          rating_noise:                     ratingNoise,
          rating_facilities:                ratingFacilities,
          rating_building_mgmt:             ratingBuildingMgmt,
          rating_flat_condition:            ratingFlatCondition,
          rating_flat_cleanliness:          ratingFlatCleanliness,
          rating_flat_layout:               ratingFlatLayout,
          rating_flat_light:                ratingFlatLight,
          rating_flat_repairs:              ratingFlatRepairs,
          rating_deposit_return:            ratingDepositReturn,
          rating_listing_accuracy:          ratingListingAccuracy,
          rating_landlord_responsiveness:   ratingLandlordResponsiveness,
          rating_would_rent_again:          ratingWouldRentAgain,
          building_day_to_day:   buildingDayToDay || undefined,
          building_issues:       buildingIssues || undefined,
          flat_day_to_day:       flatDayToDay || undefined,
          flat_issues:           flatIssues || undefined,
          landlord_experience:   landlordExperience || undefined,
          landlord_deposit:      landlordDeposit || undefined,
          landlord_rent_again:   landlordRentAgain || undefined,
          monthly_rent:          monthlyRent ? Number(monthlyRent) : undefined,
          flat_size_sqft:        flatSize ? Number(flatSize) : undefined,
          verification_method:   verifyMethod,
          verification_email:    verifyEmail || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      } else {
        sessionStorage.removeItem(REVIEW_DRAFT_KEY);
        setSubmitted(true);
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function prepareGoogleAuth() {
    const returnPath = window.location.pathname + window.location.search;
    setAuthReturnPath(returnPath);
    saveDraftState();
    return returnPath;
  }

  function saveDraftState() {
    sessionStorage.setItem(REVIEW_DRAFT_KEY, JSON.stringify({
      buildingId: searchParams?.get("building"),
      landlordId: searchParams?.get("landlord"),
      selectedProperty,
      fromYear,
      toYear,
      rentMethod,
      stillRenting,
      unitType,
      floorNumber,
      unitNumber,
      landlordName,
      overallRating,
      ratingMaintenance,
      ratingCleanliness,
      ratingPestControl,
      ratingNoise,
      ratingFacilities,
      ratingBuildingMgmt,
      ratingFlatCondition,
      ratingFlatCleanliness,
      ratingFlatLayout,
      ratingFlatLight,
      ratingFlatRepairs,
      ratingDepositReturn,
      ratingListingAccuracy,
      ratingLandlordResponsiveness,
      ratingWouldRentAgain,
      buildingDayToDay,
      buildingIssues,
      flatDayToDay,
      flatIssues,
      landlordExperience,
      landlordDeposit,
      landlordRentAgain,
      monthlyRent,
      flatSize,
      confirmChecked,
      verifyMethod,
      verifyEmail,
    }));
  }

  async function handleGoogleSignIn() {
    const returnPath = prepareGoogleAuth();
    const next = encodeURIComponent(returnPath);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  function resetForm() {
    setStep(1);
    setSelectedProperty(null);
    setSearchQuery("");
    setFromYear("");
    setToYear("current");
    setRentMethod(null);
    setStillRenting(null);
    setUnitType("");
    setFloorNumber("");
    setLandlordName("");
    setOverallRating(0);
    setRatingMaintenance(0);
    setRatingCleanliness(0);
    setRatingPestControl(0);
    setRatingNoise(0);
    setRatingFacilities(0);
    setRatingBuildingMgmt(0);
    setRatingFlatCondition(0);
    setRatingFlatCleanliness(0);
    setRatingFlatLayout(0);
    setRatingFlatLight(0);
    setRatingFlatRepairs(0);
    setRatingDepositReturn(0);
    setRatingListingAccuracy(0);
    setRatingLandlordResponsiveness(0);
    setRatingWouldRentAgain(0);
    setBuildingDayToDay("");
    setBuildingIssues("");
    setFlatDayToDay("");
    setFlatIssues("");
    setLandlordExperience("");
    setLandlordDeposit("");
    setLandlordRentAgain("");
    setMonthlyRent("");
    setFlatSize("");
    setConfirmChecked(false);
    setVerifyMethod(null);
    setVerifyEmail("");
    setSubmitted(false);
  }

  // ── Step validations ───────────────────────────────────────────────────────

  const step1Valid = selectedProperty !== null;
  const step2Valid =
    fromYear !== "" &&
    toYear !== "" &&
    rentMethod !== null &&
    stillRenting !== null &&
    unitType !== "" &&
    floorNumber.trim() !== "";
  const step3Valid =
    overallRating > 0 &&
    ratingMaintenance > 0 &&
    ratingCleanliness > 0 &&
    ratingPestControl > 0 &&
    ratingNoise > 0 &&
    ratingFacilities > 0 &&
    ratingBuildingMgmt > 0 &&
    ratingFlatCondition > 0 &&
    ratingFlatCleanliness > 0 &&
    ratingFlatLayout > 0 &&
    ratingFlatLight > 0 &&
    ratingFlatRepairs > 0 &&
    ratingDepositReturn > 0 &&
    ratingListingAccuracy > 0 &&
    ratingLandlordResponsiveness > 0 &&
    ratingWouldRentAgain > 0;
  const buildingAnswered = wc(buildingDayToDay) >= 15 || wc(buildingIssues) >= 5;
  const flatAnswered = wc(flatDayToDay) >= 15 || wc(flatIssues) >= 5;
  const landlordAnswered = wc(landlordExperience) >= 15 || wc(landlordDeposit) >= 5 || wc(landlordRentAgain) >= 5;
  const step4Valid =
    buildingAnswered &&
    flatAnswered &&
    landlordAnswered &&
    confirmChecked &&
    verifyMethod !== null &&
    (verifyMethod !== "email" || verifyEmail.trim().length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ background: "#F5F0E8", minHeight: "100vh" }}>
        <div className="max-w-xl mx-auto px-4 py-12">
          <SuccessState
            selectedProperty={selectedProperty}
            docVerified={verifyMethod === "document"}
            onReset={resetForm}
          />
        </div>
        <AnimatePresence>
          {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ── Left: context panel ── */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-[88px]">
            <ContextPanel selectedProperty={selectedProperty} />
          </div>

          {/* ── Right: form ── */}
          <div className="w-full lg:w-[60%]">
            {/* Progress bar */}
            <div
              className="bg-white rounded-[16px] p-5 mb-6"
              style={{ border: "0.5px solid #E2D9CE" }}
            >
              <ProgressBar step={step} />
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "#555555" }}>
                      Which property are you reviewing?
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                      Search by building name, landlord, or address.
                    </p>

                    {/* Search input */}
                    {!selectedProperty && (
                      <div ref={searchRef} className="relative mb-4">
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 rounded-full transition-all"
                          style={{
                            background: "#F5F0E8",
                            border: "1.5px solid #E2D9CE",
                          }}
                        >
                          <Search size={17} style={{ color: "#9CA3AF" }} className="shrink-0" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            placeholder="e.g. Harbour View Tower, Pacific Realty Holdings..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
                            style={{ color: "#555555" }}
                          />
                          {searchQuery && (
                            <button onClick={() => { setSearchQuery(""); setShowDropdown(false); }}>
                              <X size={14} style={{ color: "#9CA3AF" }} />
                            </button>
                          )}
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                          {showDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.2, ease: EASE }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] overflow-hidden z-20"
                              style={{
                                border: "0.5px solid #E2D9CE",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                              }}
                            >
                              {searchResults.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => selectProperty(r)}
                                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F5F0E8]"
                                >
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: "#E4F0EB" }}
                                  >
                                    {r.type === "building" ? (
                                      <Building2 size={15} style={{ color: "#555555" }} />
                                    ) : (
                                      <User size={15} style={{ color: "#555555" }} />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate" style={{ color: "#555555" }}>
                                      {r.name}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                                      {r.address ?? r.district} · {r.market}
                                    </p>
                                  </div>
                                  {r.badge && (
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                      style={{ background: "#E4F0EB", color: "#1F5C42" }}
                                    >
                                      {r.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Selection confirmation */}
                    {selectedProperty && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="rounded-[14px] p-4 mb-4"
                        style={{ background: "#E4F0EB", border: "1px solid #B0D4C3" }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "#E4F0EB" }}
                          >
                            {selectedProperty.type === "building" ? (
                              <Building2 size={17} style={{ color: "#555555" }} />
                            ) : (
                              <User size={17} style={{ color: "#555555" }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: "#555555" }}>
                              {selectedProperty.name}
                            </p>
                            {selectedProperty.address && (
                              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#4D8B6F" }}>
                                <MapPin size={10} />
                                {selectedProperty.address}
                              </p>
                            )}
                          </div>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "#555555" }}
                          >
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedProperty(null)}
                          className="text-xs mt-3 flex items-center gap-1 transition-colors"
                          style={{ color: "#4D8B6F" }}
                        >
                          <RotateCcw size={10} />
                          Wrong property? Search again
                        </button>
                      </motion.div>
                    )}

                    <button
                      onClick={() => setStep(2)}
                      disabled={!step1Valid}
                      className="w-full py-3.5 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                      style={{
                        background: step1Valid ? "#4D8B6F" : "#E2D9CE",
                        color: step1Valid ? "#fff" : "#9CA3AF",
                        cursor: step1Valid ? "pointer" : "not-allowed",
                      }}
                    >
                      Continue
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "#555555" }}>
                      Tell us about your tenancy
                    </h2>
                    <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
                      Quick questions — no typing yet.
                    </p>

                    {/* Q1: Tenancy years */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold mb-3" style={{ color: "#555555" }}>
                        When did you rent there?
                      </p>
                      <div className="flex items-center gap-3">
                        <select
                          value={fromYear}
                          onChange={(e) => setFromYear(e.target.value === "" ? "" : parseInt(e.target.value))}
                          className="flex-1 px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: fromYear === "" ? "#9CA3AF" : "#555555",
                          }}
                        >
                          <option value="">From year</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm" style={{ color: "#9CA3AF" }}>—</span>
                        <select
                          value={toYear}
                          onChange={(e) =>
                            setToYear(
                              e.target.value === "current"
                                ? "current"
                                : e.target.value === ""
                                ? ""
                                : parseInt(e.target.value)
                            )
                          }
                          className="flex-1 px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: "#555555",
                          }}
                        >
                          <option value="">To year</option>
                          <option value="current">Currently renting</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Q2: How did you rent */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold mb-3" style={{ color: "#555555" }}>
                        How did you rent?
                      </p>
                      <div className="flex flex-col gap-2">
                        {(
                          [
                            { value: "direct", label: "Direct with landlord" },
                            { value: "agent", label: "Through an estate agent" },
                            { value: "corporate", label: "Corporate / company relocation" },
                          ] as { value: RentMethod; label: string }[]
                        ).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRentMethod(value)}
                            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium text-left transition-all"
                            style={{
                              background: rentMethod === value ? "#E4F0EB" : "#F5F0E8",
                              border: `1.5px solid ${rentMethod === value ? "#555555" : "#E2D9CE"}`,
                              color: rentMethod === value ? "#555555" : "#6B7280",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{
                                borderColor: rentMethod === value ? "#555555" : "#D8D8D8",
                              }}
                            >
                              {rentMethod === value && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: "#555555" }}
                                />
                              )}
                            </div>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q3: Still renting */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold mb-3" style={{ color: "#555555" }}>
                        Are you still renting there?
                      </p>
                      <div
                        className="flex rounded-full p-0.5 w-fit"
                        style={{ background: "#F5F0E8", border: "1px solid #E2D9CE" }}
                      >
                        {(
                          [
                            { value: true, label: "Yes" },
                            { value: false, label: "No" },
                          ] as { value: boolean; label: string }[]
                        ).map(({ value, label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setStillRenting(value)}
                            className="px-6 py-2 rounded-full text-sm font-semibold transition-all"
                            style={{
                              background: stillRenting === value ? "#555555" : "transparent",
                              color: stillRenting === value ? "#fff" : "#6B7280",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q4: Unit type */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold mb-3" style={{ color: "#555555" }}>
                        Unit type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { value: "studio", label: "Studio" },
                            { value: "1bed",   label: "1 bed" },
                            { value: "2bed",   label: "2 bed" },
                            { value: "3bed",   label: "3 bed" },
                            { value: "4bed+",  label: "4 bed+" },
                          ] as { value: UnitType; label: string }[]
                        ).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setUnitType(value)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-medium transition-all"
                            style={{
                              background: unitType === value ? "#E4F0EB" : "#F5F0E8",
                              border: `1.5px solid ${unitType === value ? "#555555" : "#E2D9CE"}`,
                              color: unitType === value ? "#555555" : "#6B7280",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{
                                borderColor: unitType === value ? "#555555" : "#D8D8D8",
                              }}
                            >
                              {unitType === value && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: "#555555" }}
                                />
                              )}
                            </div>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q5: Floor number + Unit number */}
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-3" style={{ color: "#555555" }}>
                          Which floor were you on?
                        </p>
                        <input
                          type="text"
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(e.target.value)}
                          placeholder="e.g. 12/F or G/F"
                          className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: "#555555",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: "#555555" }}>
                          Unit number
                        </p>
                        <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                          Optional — helps identify your specific unit
                        </p>
                        <input
                          type="text"
                          value={unitNumber}
                          onChange={(e) => setUnitNumber(e.target.value)}
                          placeholder="e.g. Flat A, Unit 3, 12B"
                          className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: "#555555",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                        />
                      </div>
                    </div>

                    {/* Landlord name (optional) */}
                    <div className="mb-8">
                      <p className="text-sm font-semibold mb-1" style={{ color: "#555555" }}>
                        Who was your landlord?
                      </p>
                      <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
                        Optional — individual name, company name, or estate agency. Helps us build landlord profiles.
                      </p>
                      <input
                        type="text"
                        value={landlordName}
                        onChange={(e) => setLandlordName(e.target.value)}
                        placeholder="e.g. Pacific Realty Holdings, John Smith, Centaline Property Agency"
                        className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                        style={{
                          background: "#F5F0E8",
                          border: "1px solid #E2D9CE",
                          color: "#555555",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="px-5 py-3.5 rounded-[12px] text-sm font-semibold transition-all"
                        style={{
                          background: "#F5F0E8",
                          color: "#6B7280",
                          border: "1px solid #E2D9CE",
                        }}
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!step2Valid}
                        className="flex-1 py-3.5 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: step2Valid ? "#4D8B6F" : "#E2D9CE",
                          color: step2Valid ? "#fff" : "#9CA3AF",
                          cursor: step2Valid ? "pointer" : "not-allowed",
                        }}
                      >
                        Continue
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "#555555" }}>
                      Rate your experience
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                      Start with your overall feeling, then rate each area.
                    </p>

                    {/* Overall rating */}
                    <div
                      className="rounded-[14px] p-5 mb-6"
                      style={{
                        background: "#E4F0EB",
                        border: "1.5px solid #555555",
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4D8B6F" }}>
                        Overall rating
                      </p>
                      <div className="flex items-center gap-4">
                        <StarPicker value={overallRating} onChange={setOverallRating} size={32} />
                        {overallRating > 0 && (
                          <motion.span
                            key={overallRating}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-bold"
                            style={{ color: "#555555" }}
                          >
                            {STAR_LABELS[overallRating]}
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Section A — Building ratings */}
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#555555" }}>
                        Rate the building
                      </p>
                      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                        How was the building itself?
                      </p>
                      <div className="flex flex-col gap-4">
                        {(
                          [
                            { label: "Maintenance & repairs",       value: ratingMaintenance,    onChange: setRatingMaintenance },
                            { label: "Cleanliness of common areas", value: ratingCleanliness,    onChange: setRatingCleanliness },
                            { label: "Pest control",                value: ratingPestControl,    onChange: setRatingPestControl },
                            { label: "Noise levels",                value: ratingNoise,          onChange: setRatingNoise },
                            { label: "Building facilities",         value: ratingFacilities,     onChange: setRatingFacilities },
                            { label: "Building management",         value: ratingBuildingMgmt,   onChange: setRatingBuildingMgmt },
                          ] as { label: string; value: number; onChange: (v: number) => void }[]
                        ).map(({ label, value, onChange }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-sm flex-1 min-w-0" style={{ color: "#6B7280" }}>{label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <StarPicker value={value} onChange={onChange} size={22} />
                              {value > 0 && (
                                <motion.span
                                  key={value}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-xs font-bold w-7 text-right"
                                  style={{ color: "#4D8B6F" }}
                                >
                                  {value}/5
                                </motion.span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-6" style={{ borderTop: "1px solid #E2D9CE" }} />

                    {/* Section B — Flat ratings */}
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#555555" }}>
                        Rate the flat
                      </p>
                      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                        How was the apartment itself — not the building common areas?
                      </p>
                      <div className="flex flex-col gap-4">
                        {(
                          [
                            { label: "Overall quality of unit",    value: ratingFlatCondition,   onChange: setRatingFlatCondition },
                            { label: "Cleanliness inside the unit", value: ratingFlatCleanliness, onChange: setRatingFlatCleanliness },
                            { label: "Layout & usable space",      value: ratingFlatLayout,      onChange: setRatingFlatLayout },
                            { label: "Natural light & ventilation", value: ratingFlatLight,      onChange: setRatingFlatLight },
                            { label: "In-unit maintenance & repairs", value: ratingFlatRepairs, onChange: setRatingFlatRepairs },
                          ] as { label: string; value: number; onChange: (v: number) => void }[]
                        ).map(({ label, value, onChange }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-sm flex-1 min-w-0" style={{ color: "#6B7280" }}>{label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <StarPicker value={value} onChange={onChange} size={22} />
                              {value > 0 && (
                                <motion.span
                                  key={value}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-xs font-bold w-7 text-right"
                                  style={{ color: "#4D8B6F" }}
                                >
                                  {value}/5
                                </motion.span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-6" style={{ borderTop: "1px solid #E2D9CE" }} />

                    {/* Section C — Landlord ratings */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#555555" }}>
                        Rate your landlord
                      </p>
                      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                        How was the landlord to deal with?
                      </p>
                      <div className="flex flex-col gap-4">
                        {(
                          [
                            { label: "Deposit return",         value: ratingDepositReturn,          onChange: setRatingDepositReturn },
                            { label: "Listing accuracy",       value: ratingListingAccuracy,         onChange: setRatingListingAccuracy },
                            { label: "Landlord responsiveness",value: ratingLandlordResponsiveness,  onChange: setRatingLandlordResponsiveness },
                            { label: "Would rent again",       value: ratingWouldRentAgain,          onChange: setRatingWouldRentAgain },
                          ] as { label: string; value: number; onChange: (v: number) => void }[]
                        ).map(({ label, value, onChange }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-sm flex-1 min-w-0" style={{ color: "#6B7280" }}>{label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <StarPicker value={value} onChange={onChange} size={22} />
                              {value > 0 && (
                                <motion.span
                                  key={value}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-xs font-bold w-7 text-right"
                                  style={{ color: "#4D8B6F" }}
                                >
                                  {label === "Would rent again"
                                    ? value <= 1 ? "No" : value <= 2 ? "Probably not" : value === 3 ? "Maybe" : value === 4 ? "Probably" : "Yes"
                                    : `${value}/5`}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={() => setStep(2)}
                        className="px-5 py-3.5 rounded-[12px] text-sm font-semibold transition-all"
                        style={{
                          background: "#F5F0E8",
                          color: "#6B7280",
                          border: "1px solid #E2D9CE",
                        }}
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        disabled={!step3Valid}
                        className="flex-1 py-3.5 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: step3Valid ? "#4D8B6F" : "#E2D9CE",
                          color: step3Valid ? "#fff" : "#9CA3AF",
                          cursor: step3Valid ? "pointer" : "not-allowed",
                        }}
                      >
                        Continue
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="flex flex-col gap-5"
                >
                  {/* Card A: About the building */}
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-extrabold" style={{ color: "#555555" }}>
                        About the building
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold shrink-0 ml-3"
                        style={{ background: "#E4F0EB", color: "#1F5C42", fontSize: "11px" }}
                      >
                        Appears on building profile
                      </span>
                    </div>

                    {/* Q1 */}
                    <div className="mb-5">
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        What was the building like day-to-day?
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Lifts, cleanliness, noise, common areas, pest control — anything a future tenant should know.
                      </p>
                      <textarea
                        value={buildingDayToDay}
                        onChange={(e) => setBuildingDayToDay(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(buildingDayToDay) >= 15 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(buildingDayToDay) >= 15 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(buildingDayToDay) >= 15 && <Check size={12} />}
                          {wc(buildingDayToDay)} / 15 words minimum
                        </motion.span>
                      </div>
                    </div>

                    {/* Q2 */}
                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        Describe any issues with the building
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Be specific — this helps future tenants most. Write &apos;No significant issues&apos; if none.
                      </p>
                      <textarea
                        value={buildingIssues}
                        onChange={(e) => setBuildingIssues(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(buildingIssues) >= 5 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(buildingIssues) >= 5 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(buildingIssues) >= 5 && <Check size={12} />}
                          {wc(buildingIssues)} / 5 words minimum
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  {/* Card B: About the flat */}
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-extrabold" style={{ color: "#555555" }}>
                        About the flat
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold shrink-0 ml-3"
                        style={{ background: "#E4F0EB", color: "#1F5C42", fontSize: "11px" }}
                      >
                        Appears on building profile
                      </span>
                    </div>

                    <div className="mb-5">
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        What was the flat like day-to-day?
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Layout, appliances, storage, natural light, ventilation — what was it actually like living in the unit?
                      </p>
                      <textarea
                        value={flatDayToDay}
                        onChange={(e) => setFlatDayToDay(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(flatDayToDay) >= 15 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(flatDayToDay) >= 15 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(flatDayToDay) >= 15 && <Check size={12} />}
                          {wc(flatDayToDay)} / 15 words minimum
                        </motion.span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        Describe any issues with the flat
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Damp, mould, broken fixtures, poor insulation — anything specific to the unit. Write &apos;No significant issues&apos; if none.
                      </p>
                      <textarea
                        value={flatIssues}
                        onChange={(e) => setFlatIssues(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(flatIssues) >= 5 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(flatIssues) >= 5 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(flatIssues) >= 5 && <Check size={12} />}
                          {wc(flatIssues)} / 5 words minimum
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  {/* Card C: About the landlord */}
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-extrabold" style={{ color: "#555555" }}>
                        About the landlord
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold shrink-0 ml-3"
                        style={{ background: "#FDE8E3", color: "#A83820", fontSize: "11px" }}
                      >
                        Appears on landlord profile
                      </span>
                    </div>

                    {/* Q3 */}
                    <div className="mb-5">
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        How was the landlord to deal with?
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Communication, responsiveness, maintenance requests — what was it actually like?
                      </p>
                      <textarea
                        value={landlordExperience}
                        onChange={(e) => setLandlordExperience(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(landlordExperience) >= 15 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(landlordExperience) >= 15 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(landlordExperience) >= 15 && <Check size={12} />}
                          {wc(landlordExperience)} / 15 words minimum
                        </motion.span>
                      </div>
                    </div>

                    {/* Q4 */}
                    <div className="mb-5">
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        How was the deposit handled?
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        Was it returned in full? How long did it take? Were any deductions fair?
                      </p>
                      <textarea
                        value={landlordDeposit}
                        onChange={(e) => setLandlordDeposit(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(landlordDeposit) >= 5 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(landlordDeposit) >= 5 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(landlordDeposit) >= 5 && <Check size={12} />}
                          {wc(landlordDeposit)} / 5 words minimum
                        </motion.span>
                      </div>
                    </div>

                    {/* Q5 */}
                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: "#555555" }}>
                        Would you rent from this landlord again?
                      </label>
                      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                        One sentence is fine.
                      </p>
                      <textarea
                        value={landlordRentAgain}
                        onChange={(e) => setLandlordRentAgain(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-3.5 rounded-[12px] text-sm resize-none outline-none transition-all"
                        style={{
                          background: "#F5F0E8",
                          border: "1.5px solid #E2D9CE",
                          color: "#555555",
                          lineHeight: "1.6",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#4D8B6F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E2D9CE")}
                      />
                      <div className="flex justify-end mt-1">
                        <motion.span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: wc(landlordRentAgain) >= 5 ? "#555555" : "#9CA3AF" }}
                          animate={{ color: wc(landlordRentAgain) >= 5 ? "#555555" : "#9CA3AF" }}
                        >
                          {wc(landlordRentAgain) >= 5 && <Check size={12} />}
                          {wc(landlordRentAgain)} / 5 words minimum
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  {/* Minimum answers note */}
                  <p className="text-xs text-center px-2" style={{ color: "#6B7280" }}>
                    Answer at least one building, flat, and landlord question to post your review.
                  </p>

                  {/* Card D: Rental figures */}
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <h2 className="text-lg font-extrabold mb-1" style={{ color: "#555555" }}>
                      Rental figures
                    </h2>
                    <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                      Optional — helps others compare value for similar units.
                    </p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6B7280" }}>
                          Monthly rent paid (HKD)
                        </label>
                        <input
                          type="number"
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(e.target.value)}
                          placeholder="e.g. 18000"
                          className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: "#555555",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6B7280" }}>
                          Flat size (sqft, saleable)
                        </label>
                        <input
                          type="number"
                          value={flatSize}
                          onChange={(e) => setFlatSize(e.target.value)}
                          placeholder="e.g. 450"
                          className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                          style={{
                            background: "#F5F0E8",
                            border: "1px solid #E2D9CE",
                            color: "#555555",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card E: Verify identity */}
                  <div
                    className="bg-white rounded-[16px] p-6 sm:p-8"
                    style={{ border: "0.5px solid #E2D9CE" }}
                  >
                    <h2 className="text-lg font-extrabold mb-1" style={{ color: "#555555" }}>
                      One last step — verify it&apos;s you
                    </h2>
                    <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                      Your identity is never shown publicly.
                    </p>

                    {/* Confirm checkbox */}
                    <button
                      type="button"
                      onClick={() => setConfirmChecked(!confirmChecked)}
                      className="flex items-start gap-3 text-left w-full mb-5"
                    >
                      <div
                        className="w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                        style={{
                          background: confirmChecked ? "#555555" : "transparent",
                          borderColor: confirmChecked ? "#555555" : "#D8D8D8",
                        }}
                      >
                        {confirmChecked && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                        I confirm this review is based on my genuine personal experience and does
                        not contain false statements.
                      </span>
                    </button>

                    <div className="flex flex-col gap-3">
                      {/* Google */}
                      <button
                        type="button"
                        onClick={() => setVerifyMethod("google")}
                        className="rounded-[14px] p-4 text-left transition-all"
                        style={{
                          border: `1.5px solid ${verifyMethod === "google" ? "#555555" : "#E2D9CE"}`,
                          background: verifyMethod === "google" ? "#E4F0EB" : "#fff",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "#fff", border: "1px solid #E2D9CE" }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: "#555555" }}>
                                {user ? "Signed in with Google" : "Sign in with Google"}
                              </span>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "#555555", color: "#fff" }}
                              >
                                Recommended
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: user ? "#4D8B6F" : "#9CA3AF" }}>
                              {user
                                ? `✓ ${user.email}`
                                : "Your name is never shown — only \"Verified Tenant\" appears"}
                            </p>
                          </div>
                          {verifyMethod === "google" && (
                            <Check size={16} style={{ color: "#555555" }} className="shrink-0" />
                          )}
                        </div>
                        {verifyMethod === "google" && !user && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="mt-3 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGoogleSignIn();
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-all"
                              style={{
                                background: "#fff",
                                border: "1.5px solid #E2D9CE",
                                color: "#555555",
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                              Sign in with Google
                            </button>
                          </motion.div>
                        )}
                      </button>

                      {/* Email */}
                      <button
                        type="button"
                        onClick={() => setVerifyMethod("email")}
                        className="rounded-[14px] p-4 text-left transition-all"
                        style={{
                          border: `1.5px solid ${verifyMethod === "email" ? "#555555" : "#E2D9CE"}`,
                          background: verifyMethod === "email" ? "#E4F0EB" : "#fff",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "#F5F0E8" }}
                          >
                            <Mail size={17} style={{ color: "#555555" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold" style={{ color: "#555555" }}>
                              Email verification
                            </span>
                            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                              We send a one-click link. Takes 60 seconds.
                            </p>
                          </div>
                          {verifyMethod === "email" && (
                            <Check size={16} style={{ color: "#555555" }} className="shrink-0" />
                          )}
                        </div>
                        {verifyMethod === "email" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="mt-3 overflow-hidden"
                          >
                            <input
                              type="email"
                              value={verifyEmail}
                              onChange={(e) => setVerifyEmail(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="your@email.com"
                              className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                              style={{
                                background: "#fff",
                                border: "1.5px solid #E4F0EB",
                                color: "#555555",
                              }}
                            />
                          </motion.div>
                        )}
                      </button>

                      {/* Document */}
                      <button
                        type="button"
                        onClick={() => setVerifyMethod("document")}
                        className="rounded-[14px] p-4 text-left transition-all"
                        style={{
                          border: `1.5px solid ${verifyMethod === "document" ? "#555555" : "#E2D9CE"}`,
                          background: verifyMethod === "document" ? "#E4F0EB" : "#fff",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "#F5F0E8" }}
                          >
                            <Upload size={17} style={{ color: "#555555" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: "#555555" }}>
                                Upload a document
                              </span>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "#E4F0EB", color: "#1F5C42" }}
                              >
                                Manual verification
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                              After submitting, email your tenancy proof to joe@rentradar.co for
                              manual verification.
                            </p>
                          </div>
                          {verifyMethod === "document" && (
                            <Check size={16} style={{ color: "#555555" }} className="shrink-0" />
                          )}
                        </div>
                        {verifyMethod === "document" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="mt-3 overflow-hidden"
                          >
                            <div
                              className="p-4 rounded-[10px]"
                              style={{
                                border: "1.5px solid #B0D4C3",
                                background: "#F5F0E8",
                              }}
                            >
                              <p className="text-xs leading-relaxed" style={{ color: "#4D8B6F" }}>
                                Send your document (utility bill, bank statement, or tenancy agreement)
                                to <strong>joe@rentradar.co</strong> from the same email you use here.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setStep(3)}
                        className="px-5 py-3.5 rounded-[12px] text-sm font-semibold transition-all"
                        style={{
                          background: "#F5F0E8",
                          color: "#6B7280",
                          border: "1px solid #E2D9CE",
                        }}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!step4Valid || isSubmitting}
                        className="flex-1 py-3.5 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: step4Valid && !isSubmitting ? "#4D8B6F" : "#E2D9CE",
                          color: step4Valid && !isSubmitting ? "#fff" : "#9CA3AF",
                          cursor: step4Valid && !isSubmitting ? "pointer" : "not-allowed",
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Submitting...
                          </>
                        ) : (
                          "Post my review"
                        )}
                      </button>
                    </div>

                    {/* Inline submit error */}
                    {submitError && (
                      <p className="mt-3 text-xs text-center" style={{ color: "#A83820" }}>
                        {submitError}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
