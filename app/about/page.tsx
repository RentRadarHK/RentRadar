import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = pageMetadata({
  title: "About | RentRadar",
  description:
    "RentRadar was built to give tenants the information they deserve. Learn how we're making the Hong Kong rental market fairer, one review at a time.",
  path: "/about",
});

export default function Page() {
  return (
    <main>
      <Navbar />
      <AboutPage />
      <Footer />
    </main>
  );
}
