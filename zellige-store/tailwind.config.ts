import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1320px" } },
    extend: {
      colors: {
        ivory: { DEFAULT: "#FAF6EE", 50: "#FDFBF7", 100: "#FAF6EE", 200: "#F2EADB", 300: "#E6DAC3" },
        charcoal: { DEFAULT: "#23211F", 600: "#4A4642", 500: "#6B655E", 400: "#8F877D" },
        majorelle: { DEFAULT: "#1E3F8A", 50: "#EEF2FA", 100: "#D7E0F3", 600: "#1E3F8A", 700: "#173270", 800: "#11264F" },
        terracotta: { DEFAULT: "#B4502F", 50: "#FBF0EB", 100: "#F4D9CD", 600: "#B4502F", 700: "#923F24" },
        emerald: { DEFAULT: "#1E6B57", 50: "#EAF4F0", 100: "#CBE5DB", 600: "#1E6B57", 700: "#175444" },
        saffron: { DEFAULT: "#D6A23A", 50: "#FBF4E4", 100: "#F4E2B6", 600: "#D6A23A", 700: "#A87A22" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,33,31,.04), 0 8px 24px -12px rgba(35,33,31,.18)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { "fade-up": "fade-up .5s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
