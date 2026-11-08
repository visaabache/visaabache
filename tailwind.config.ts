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
        "ken-burns": { "0%": { transform: "scale(1.04)" }, "100%": { transform: "scale(1.14) translate(-1.5%, -1%)" } },
        "word-in": { "0%": { opacity: "0", transform: "translateY(0.6em) rotate(2deg)", filter: "blur(8px)" }, "100%": { opacity: "1", transform: "none", filter: "blur(0)" } },
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1) rotate(0deg)" },
          "33%": { transform: "translate3d(8%,-6%,0) scale(1.15) rotate(25deg)" },
          "66%": { transform: "translate3d(-6%,6%,0) scale(0.92) rotate(-15deg)" },
        },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "float-slow": { "0%,100%": { transform: "translateY(0) rotate(-2deg)" }, "50%": { transform: "translateY(10px) rotate(2deg)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-reverse": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        "spin-slow": { "100%": { transform: "rotate(360deg)" } },
        "gradient-x": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        "pop-in": { "0%": { opacity: "0", transform: "scale(.85) translateY(8px)" }, "60%": { opacity: "1", transform: "scale(1.03)" }, "100%": { opacity: "1", transform: "none" } },
        "progress-fill": { "0%": { width: "12%" }, "60%,100%": { width: "78%" } },
        ping2: { "75%,100%": { transform: "scale(2.2)", opacity: "0" } },
        "border-spin": { "100%": { "--angle": "360deg" } },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .4s ease-out both",
        "ken-burns": "ken-burns 24s ease-out both alternate infinite",
        "word-in": "word-in .8s cubic-bezier(.2,.7,.2,1) both",
        aurora: "aurora 18s ease-in-out infinite",
        "aurora-slow": "aurora 26s ease-in-out infinite reverse",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 46s linear infinite",
        "spin-slow": "spin-slow 60s linear infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "pop-in": "pop-in .7s cubic-bezier(.2,.7,.2,1) both",
        "progress-fill": "progress-fill 4s cubic-bezier(.6,0,.2,1) infinite alternate",
        ping2: "ping2 2.4s cubic-bezier(0,0,.2,1) infinite",
        "border-spin": "border-spin 6s linear infinite",
      },
    },
  },
  plugins: [typography],
};
export default config;
