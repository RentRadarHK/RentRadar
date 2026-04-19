import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RentRadar — The Rental Market's Trust Layer",
  description:
    "Search verified tenant reviews for landlords and properties in Hong Kong and Singapore. Good landlords stand out. Bad ones are accountable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/brand/favicon-32.svg"/>
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/brand/favicon-16.svg"/>
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.svg"/>
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
