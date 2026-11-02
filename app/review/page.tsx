import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewForm from "@/components/ReviewForm";

export const metadata = pageMetadata({
  title: "Write a review | RentRadar",
  description:
    "Share your experience as a tenant. Your review helps protect future renters and rewards great landlords.",
  path: "/review",
});

export default function ReviewPage() {
  return (
    <main>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F5F0E8" }} />}>
        <ReviewForm />
      </Suspense>
      <Footer />
    </main>
  );
}
