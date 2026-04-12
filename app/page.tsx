import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoBar from "@/components/LogoBar";
import HowItWorks from "@/components/HowItWorks";
import ReviewCards from "@/components/ReviewCards";
import StatsSection from "@/components/StatsSection";
import DualCTA from "@/components/DualCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <LogoBar />
      <HowItWorks />
      <ReviewCards />
      <StatsSection />
      <DualCTA />
      <Footer />
    </main>
  );
}
