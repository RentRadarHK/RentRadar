import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForLandlordsPage from "@/components/ForLandlordsPage";

export const metadata: Metadata = {
  title: "For Landlords — RentRadar",
  description:
    "Claim your RentRadar profile, get verified, and respond to tenant reviews. Free to claim — no subscription required.",
};

export default function Page() {
  return (
    <main>
      <Navbar />
      <ForLandlordsPage />
      <Footer />
    </main>
  );
}
