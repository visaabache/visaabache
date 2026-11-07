import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin", "/*/account", "/*/login", "/*/register", "/*/reset-password", "/*/apply/success"] }],
    sitemap: appUrl("/sitemap.xml"),
  };
}
