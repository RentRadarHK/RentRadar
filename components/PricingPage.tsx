import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const FREE = [
  "Every tenant review on every Hong Kong Island building",
  "Rent paid and saleable area when a reviewer shared them",
  "Landlord profiles and government building records",
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F5F0E8" }}>
      <section className="pt-32 pb-20 px-5 sm:px-8">
        <div className="max-w-[640px] mx-auto text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#4D8B6F" }}
          >
            Pricing
          </p>
          <h1
            className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5"
            style={{ color: "#555555" }}
          >
            Reviews are free.
          </h1>
          <p className="text-lg leading-relaxed mb-10" style={{ color: "#6B7280" }}>
            Reading tenant reviews does not require an account or a subscription.
            RentRadar will charge for rental listings later, once there are enough
            reviews for a listing to sit next to real tenant experience.
          </p>
          <ul className="text-left flex flex-col gap-3.5 mb-10 max-w-[480px] mx-auto">
            {FREE.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#6B7280" }}>
                <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: "#4D8B6F" }} />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center justify-center font-bold text-sm px-7 py-3.5 rounded-[12px] text-white"
              style={{ background: "#4D8B6F" }}
            >
              Search buildings
            </Link>
            <Link
              href="/review"
              className="inline-flex items-center justify-center font-bold text-sm px-7 py-3.5 rounded-[12px]"
              style={{ color: "#555555", border: "1.5px solid #555555" }}
            >
              Write a review
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
