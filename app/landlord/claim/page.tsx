import { pageMetadata } from "@/lib/seo";
import { getLandlord } from "@/lib/supabase/queries";
import LandlordClaimForm from "@/components/LandlordClaimForm";
import Navbar from "@/components/Navbar";

export const metadata = pageMetadata({
  title: "Claim your landlord profile | RentRadar",
  description: "Claim your RentRadar landlord profile and start responding to tenant reviews.",
  path: "/landlord/claim",
});

interface Props {
  searchParams: { id?: string; q?: string };
}

export default async function ClaimPage({ searchParams }: Props) {
  const landlordId = searchParams.id ?? "";
  const landlord = landlordId ? await getLandlord(landlordId) : null;

  return (
    <main>
      <Navbar />
      <LandlordClaimForm
        landlordId={landlordId}
        landlordName={landlord?.name ?? null}
        claimStatus={landlord?.claimStatus ?? null}
        initialSearchQuery={searchParams.q ?? ""}
      />
    </main>
  );
}
