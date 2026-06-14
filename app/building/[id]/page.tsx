import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import BuildingProfile from "@/components/BuildingProfile";
import Footer from "@/components/Footer";
import { getBuilding, getReviewsForBuilding, getLandlordsForBuilding, getLandlordsReferencedInReviews } from "@/lib/supabase/queries";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const building = await getBuilding(params.id);
  if (!building) return { title: "Building Not Found — RentRadar" };
  return {
    title: `${building.name} — RentRadar`,
    description: `Official building record, tenant reviews, and government statutory orders for ${building.name}, ${building.address}.`,
  };
}

export default async function BuildingPage({ params }: Props) {
  const building = await getBuilding(params.id);
  if (!building) notFound();

  const [reviews, linkedLandlords] = await Promise.all([
    getReviewsForBuilding(params.id),
    getLandlordsForBuilding(params.id),
  ]);

  const landlords = await getLandlordsReferencedInReviews(reviews, linkedLandlords);

  return (
    <main>
      <Navbar />
      <BuildingProfile
        building={building}
        reviews={reviews}
        linkedLandlords={landlords}
      />
      <Footer />
    </main>
  );
}
