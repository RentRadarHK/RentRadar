import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorksPage from "@/components/HowItWorksPage";

export const metadata: Metadata = {
  title: "How It Works — RentRadar",
  description:
    "Everything you need to know about finding trustworthy landlords in Hong Kong. Search buildings, read verified reviews, and decide with confidence.",
};

export default function Page() {
  return (
    <main>
      <Navbar />
      <HowItWorksPage />
      <Footer />
    </main>
  );
}
