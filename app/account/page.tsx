import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountClient from "@/components/AccountClient";

export const metadata = {
  title: "My Account — RentRadar",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signup");

  return (
    <main>
      <Navbar />
      <AccountClient user={user} />
      <Footer />
    </main>
  );
}
