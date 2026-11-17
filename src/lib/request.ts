import { headers } from "next/headers";

/**
 * Client IP and user agent of the current request. On Cloudflare the IP is CF-Connecting-IP, measured by Cloudflare
 * (cf-worker.ts also rewrites X-Forwarded-For from it), so visitors cannot fake it to dodge rate limits.
 */
export async function getRequestMeta() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = h.get("cf-connecting-ip") || (fwd ? fwd.split(",")[0] : h.get("x-real-ip")) || "unknown";
  return { ip: ip.trim().slice(0, 64), userAgent: (h.get("user-agent") || "").slice(0, 300) };
}
