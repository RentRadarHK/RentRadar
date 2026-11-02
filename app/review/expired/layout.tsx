import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Verification link expired | RentRadar",
  description: "This RentRadar review verification link has expired.",
  path: "/review/expired",
});

export default function ReviewExpiredLayout({ children }: { children: React.ReactNode }) {
  return children;
}
