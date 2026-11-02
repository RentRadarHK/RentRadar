import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountClient from "@/components/AccountClient";

export const metadata = pageMetadata({
  title: "My account | RentRadar",
  description: "Manage your RentRadar account settings.",
  path: "/account",
});

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <main>
      <Navbar />
      <AccountClient user={user} />
      <Footer />
    </main>
  );
}
