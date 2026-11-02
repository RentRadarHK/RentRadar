import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Review verified | RentRadar",
  description: "Your RentRadar review has been verified and is awaiting publication.",
  path: "/review/verified",
});

export default function ReviewVerifiedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
