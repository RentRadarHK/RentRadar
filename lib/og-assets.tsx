export const OG_SIZE = { width: 1200, height: 630 };

export function PinMark({ size = 72 }: { size?: number }) {
  const scale = size / 60;
  return (
    <div
      style={{
        width: 56 * scale,
        height: 60 * scale,
        display: "flex",
      }}
    >
      <svg
        width={56 * scale}
        height={60 * scale}
        viewBox="-2 -8 60 72"
        fill="none"
      >
        <path
          d="M14 16 A 14 14 0 0 1 42 16"
          stroke="#555555"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
        <path
          d="M8 14 A 20 20 0 0 1 48 14"
          stroke="#4D8B6F"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M28 54 C 28 54, 16 38, 16 26 A 12 12 0 0 1 40 26 C 40 38, 28 54, 28 54 Z"
          stroke="#555555"
          strokeWidth="2.6"
          fill="none"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="26" r="3.6" fill="#4D8B6F" />
      </svg>
    </div>
  );
}

export async function loadOutfitFont(weight: 600 | 700 = 700): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/fontsource/fonts/outfit@5.2.5/latin-${weight}-normal.ttf`
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
