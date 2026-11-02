import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = pageMetadata({
  title: "Reviews are free | RentRadar",
  description: "Tenant reviews on RentRadar are free to read. Rental listings will be charged later, once buildings have enough reviews.",
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
