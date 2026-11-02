import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { getLandlordByUserId, getReviewsForLandlord } from "@/lib/supabase/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LandlordDashboard from "@/components/LandlordDashboard";

export const metadata = pageMetadata({
  title: "Landlord dashboard | RentRadar",
  description: "Manage your RentRadar landlord profile and respond to tenant reviews.",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const landlord = await getLandlordByUserId(user.id);
  if (!landlord) redirect("/landlord/claim");

  const reviews = await getReviewsForLandlord(landlord.id);

  return (
    <main>
      <Navbar />
      <LandlordDashboard landlord={landlord} reviews={reviews} />
      <Footer />
    </main>
  );
}
