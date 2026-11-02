import { ImageResponse } from "next/og";
import { OG_SIZE, PinMark, loadOutfitFont } from "@/lib/og-assets";

export const runtime = "edge";
export const alt = "Don't rent blind.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const font = await loadOutfitFont(700);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F5F0E8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font ? "Outfit" : "sans-serif",
        }}
      >
        <PinMark size={96} />
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#4D8B6F",
          }}
        >
          RentRadar
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 56,
            fontWeight: 700,
            color: "#555555",
            letterSpacing: "-0.02em",
          }}
        >
          Don&apos;t rent blind.
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: font
        ? [{ name: "Outfit", data: font, style: "normal", weight: 700 }]
        : undefined,
    }
  );
}
