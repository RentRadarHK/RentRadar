import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = pageMetadata({
  title: "Pricing | RentRadar",
  description: "Full access to verified tenant reviews and building data in Hong Kong. HKD 29/month.",
  path: "/pricing",
});

export default function Page() {
  return (
    <main>
      <Navbar />
      <PricingPage />
      <Footer />
    </main>
  );
}
