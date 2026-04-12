import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewForm from "@/components/ReviewForm";

export const metadata = {
  title: "Write a Review — RentRadar",
  description:
    "Share your experience as a tenant. Your review helps protect future renters and rewards great landlords.",
};

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
