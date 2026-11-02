import { ImageResponse } from "next/og";
import { getBuilding } from "@/lib/supabase/queries";
import { OG_SIZE, PinMark, loadOutfitFont } from "@/lib/og-assets";

export const runtime = "edge";
export const alt = "RentRadar building profile";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: { id: string };
}

export default async function Image({ params }: Props) {
  const building = await getBuilding(params.id);
  const fontBold = await loadOutfitFont(700);
  const fontSemi = await loadOutfitFont(600);

  const name = building?.name ?? "Building profile";
  const district = building?.district ?? "Hong Kong Island";
  const rating = building?.avgRating ?? 0;
  const reviews = building?.totalReviews ?? 0;
  const stars =
    reviews > 0
      ? `${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))}`
      : "No reviews yet";
  const reviewLabel =
    reviews === 1 ? "1 tenant review" : `${reviews} tenant reviews`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F5F0E8",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: fontBold ? "Outfit" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PinMark size={56} />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#4D8B6F",
            }}
          >
            RentRadar
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#4D8B6F",
              marginBottom: 12,
            }}
          >
            {district}
          </div>
          <div
            style={{
              fontSize: name.length > 36 ? 52 : 64,
              fontWeight: 700,
              color: "#555555",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 32,
                color: "#F59E0B",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              {stars}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#555555" }}>
              {reviews > 0 ? `${rating.toFixed(1)} · ${reviewLabel}` : reviewLabel}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#6B7280" }}>
            Don&apos;t rent blind.
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        ...(fontBold
          ? [{ name: "Outfit", data: fontBold, style: "normal" as const, weight: 700 as const }]
          : []),
        ...(fontSemi
          ? [{ name: "Outfit", data: fontSemi, style: "normal" as const, weight: 600 as const }]
          : []),
      ],
    }
  );
}
