import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SearchResults from "@/components/SearchResults";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Search Landlords & Buildings — RentRadar",
  description:
    "Search verified tenant reviews for landlords and buildings across Hong Kong and Singapore.",
};

function SearchFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#F5F0E8" }}
    >
      <div className="flex flex-col gap-3 w-full max-w-[600px] px-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-[16px] animate-pulse"
            style={{ background: "#E2D9CE" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main>
      <Navbar />
      <Suspense fallback={<SearchFallback />}>
        <SearchResults />
      </Suspense>
      <Footer />
    </main>
  );
}
