import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#555555",
        secondary: "#4D8B6F",
        "secondary-dark": "#3A7059",
        "secondary-tint": "#E4F0EB",
        "secondary-tint-border": "#B0D4C3",
        accent: "#E8573A",
        "accent-tint": "#FDE8E3",
        background: "#F5F0E8",
        card: "#FFFFFF",
        border: "#E2D9CE",
        "text-body": "#6B7280",
        "text-muted": "#9CA3AF",
        amber: "#F59E0B",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.10)",
        search: "0 8px 40px rgba(0,0,0,0.10)",
      },
      borderRadius: {
        card: "16px",
        btn: "999px",
        search: "24px",
      },
    },
  },
  plugins: [],
};
export default config;
