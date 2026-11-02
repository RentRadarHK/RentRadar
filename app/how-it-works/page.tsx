import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorksPage from "@/components/HowItWorksPage";

export const metadata: Metadata = pageMetadata({
  title: "How it works | RentRadar",
  description:
    "Everything you need to know about finding trustworthy landlords in Hong Kong. Search buildings, read verified reviews, and decide with confidence.",
  path: "/how-it-works",
});

export default function Page() {
  return (
    <main>
      <Navbar />
      <HowItWorksPage />
      <Footer />
    </main>
  );
}
