import type { Metadata } from "next";
import { Suspense } from "react";
import SignInPage from "@/components/auth/SignInPage";

export const metadata: Metadata = {
  title: "Sign In — RentRadar",
  description: "Sign in to RentRadar to write reviews, claim your landlord profile, and manage your account.",
};

export default function Page() {
  return (
    <main>
      <Suspense>
        <SignInPage />
      </Suspense>
    </main>
  );
}
