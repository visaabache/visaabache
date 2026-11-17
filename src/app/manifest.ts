import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VISA ABACHE — Assistance visa · Maroc",
    short_name: "VISA ABACHE",
    start_url: "/fr",
    display: "standalone",
    background_color: "#0b1a33",
    theme_color: "#102747",
    icons: [
      { src: "/brand/visa-abache-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
