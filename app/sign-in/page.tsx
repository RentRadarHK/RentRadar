import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import SignInPage from "@/components/auth/SignInPage";

export const metadata: Metadata = pageMetadata({
  title: "Sign in | RentRadar",
  description: "Sign in to RentRadar to write reviews, claim your landlord profile, and manage your account.",
  path: "/sign-in",
});

export default function Page() {
  return (
    <main>
      <Suspense>
        <SignInPage />
      </Suspense>
    </main>
  );
}
