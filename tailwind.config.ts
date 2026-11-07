import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: {
          50: "#eef2f8", 100: "#d6dfee", 200: "#adbfdc", 300: "#7d97c2", 400: "#4f6ea3",
          500: "#2f4f85", 600: "#1f3b69", 700: "#172f56", 800: "#102747", 900: "#0b1b33", 950: "#07111f",
        },
        gold: {
          50: "#fbf7ef", 100: "#f4ead4", 200: "#e9d4a9", 300: "#dcbb7d", 400: "#d1ad69",
          500: "#c9a45c", 600: "#b08944", 700: "#8c6b35", 800: "#6b522b", 900: "#4d3b20",
        },
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "Georgia", "serif"],
        arabic: ["Cairo", "'Inter Variable'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,39,71,.04), 0 8px 24px -8px rgba(16,39,71,.12)",
        premium: "0 24px 60px -20px rgba(16,39,71,.35)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .4s ease-out both",
      },
    },
  },
  plugins: [typography],
};
export default config;
