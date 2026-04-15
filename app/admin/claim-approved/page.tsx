import Link from "next/link";

export const metadata = { title: "Claim Approved — RentRadar" };

export default function ClaimApprovedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#F5F0E8" }}>
      <div className="max-w-sm text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ background: "#E4F0EB" }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#555555" }}>Claim approved</h1>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          The landlord claim has been approved. The claimant has been notified by email.
        </p>
        <Link
          href="/"
          className="text-sm font-semibold px-5 py-2.5 rounded-[10px] text-white"
          style={{ background: "#4D8B6F" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
