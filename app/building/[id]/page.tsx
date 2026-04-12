import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import BuildingProfile from "@/components/BuildingProfile";
import Footer from "@/components/Footer";
import { getBuilding, getReviewsForBuilding, getLandlordsForBuilding } from "@/lib/supabase/queries";

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
  const [building, reviews, linkedLandlords] = await Promise.all([
    getBuilding(params.id),
    getReviewsForBuilding(params.id),
    getLandlordsForBuilding(params.id),
  ]);

  if (!building) notFound();

  return (
    <main>
      <Navbar />
      <BuildingProfile
        building={building}
        reviews={reviews}
        linkedLandlords={linkedLandlords}
      />
      <Footer />
    </main>
  );
}
