import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, pageMetadata } from "@/lib/seo";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const rootMeta = pageMetadata({
  title: "RentRadar | The Rental Market's Trust Layer",
  description:
    "Honest tenant reviews and detailed profiles for 6,600+ Hong Kong Island buildings. Don't rent blind.",
  path: "/",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...rootMeta,
  icons: {
    icon: [
      { url: "/brand/favicon-32.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/brand/favicon-16.svg", sizes: "16x16", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/brand/favicon-32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/brand/favicon-16.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: "RentRadar",
                url: SITE_URL,
                logo: `${SITE_URL}/brand/pin-only.svg`,
                email: "joe@rentradar.co",
                areaServed: {
                  "@type": "AdministrativeArea",
                  name: "Hong Kong Island",
                },
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: "RentRadar",
                url: SITE_URL,
                publisher: { "@id": `${SITE_URL}/#organization` },
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${SITE_URL}/search?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
