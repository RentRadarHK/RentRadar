import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BuildingProfile from "@/components/BuildingProfile";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getBuilding, getReviewsForBuilding, getLandlordsForBuilding, getLandlordsReferencedInReviews } from "@/lib/supabase/queries";
import {
  absoluteUrl,
  buildingFallbackDescription,
  pageMetadata,
  trimToWholeWord,
} from "@/lib/seo";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const building = await getBuilding(params.id);
  if (!building) {
    return pageMetadata({
      title: "Building not found | RentRadar",
      description: "This building profile could not be found on RentRadar.",
      path: `/building/${params.id}`,
    });
  }

  const title = `${building.name}, ${building.district} | Tenant Reviews | RentRadar`;
  const description = building.description
    ? trimToWholeWord(building.description, 155)
    : buildingFallbackDescription(building.name, building.district);

  return pageMetadata({
    title,
    description,
    path: `/building/${building.id}`,
  });
}

export default async function BuildingPage({ params }: Props) {
  const building = await getBuilding(params.id);
  if (!building) notFound();

  const [reviews, linkedLandlords] = await Promise.all([
    getReviewsForBuilding(params.id),
    getLandlordsForBuilding(params.id),
  ]);

  const landlords = await getLandlordsReferencedInReviews(reviews, linkedLandlords);
  const pageUrl = absoluteUrl(`/building/${building.id}`);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: building.name,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: building.address,
      addressLocality: building.district,
      addressRegion: "Hong Kong Island",
      addressCountry: "HK",
    },
  };

  if (building.latitude != null && building.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: building.latitude,
      longitude: building.longitude,
    };
  }

  if (building.totalReviews >= 1) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: building.avgRating,
      reviewCount: building.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <main>
      <JsonLd data={jsonLd} />
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
