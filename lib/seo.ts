import type { Metadata } from "next";

export const SITE_URL = "https://rentradar.co";

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function trimToWholeWord(text: string, max = 155): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const sliced = collapsed.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  const trimmed = (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim();
  return trimmed.replace(/[.,;:]+$/, "");
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "RentRadar",
      type: "website",
      locale: "en_HK",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildingFallbackDescription(name: string, district: string): string {
  return `Tenant reviews, rent paid and building information for ${name}, ${district}, Hong Kong.`;
}
