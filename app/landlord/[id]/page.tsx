import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LandlordProfile from "@/components/LandlordProfile";
import Footer from "@/components/Footer";
import { getLandlord, getBuildingsForLandlord, getReviewsForLandlord } from "@/lib/supabase/queries";
import { pageMetadata } from "@/lib/seo";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landlord = await getLandlord(params.id);
  return pageMetadata({
    title: landlord ? `${landlord.name} | Tenant Reviews | RentRadar` : "Landlord profile | RentRadar",
    description: landlord
      ? `Read verified tenant reviews for ${landlord.name}. See ratings for deposit return, responsiveness, maintenance and more.`
      : "Verified tenant reviews on RentRadar.",
    path: `/landlord/${params.id}`,
  });
}

export default async function LandlordPage({ params }: Props) {
  const [landlord, linkedBuildings, reviews] = await Promise.all([
    getLandlord(params.id),
    getBuildingsForLandlord(params.id),
    getReviewsForLandlord(params.id),
  ]);

  // Derive the primary address from the first linked building
  const primaryAddress = linkedBuildings[0]?.address;

  return (
    <main>
      <Navbar />
      <LandlordProfile
        landlordData={landlord ?? undefined}
        landlordReviews={reviews}
        linkedBuildings={linkedBuildings}
        primaryAddress={primaryAddress}
      />
      <Footer />
    </main>
  );
}
