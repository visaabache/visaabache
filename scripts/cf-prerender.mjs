/**
 * Fills the Cloudflare page cache for a Worker version WITHOUT rendering on Cloudflare (whose free plan allows
 * ~10 ms of CPU per request — a burst of renders after a deploy causes error 1102).
 * Runs `next start` locally on the very build that was uploaded (same chunk hashes and Server Action ids), renders
 * every cacheable page of the sitemap against the production database, and writes the HTML to KV under the keys
 * cf-worker.ts reads (pc2:<version>:<path>).
 *
 *   # after `npm run cf:build` and `wrangler versions upload` (gives <version-id>), before `versions deploy`:
 *   DATABASE_URL=… SESSION_SECRET=… DOCUMENT_ENCRYPTION_KEY=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… \
 *     node scripts/cf-prerender.mjs <version-id>
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const version = process.argv[2];
if (!version) throw new Error("usage: node scripts/cf-prerender.mjs <worker-version-id>");
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const ns = process.env.STATIC_KV_ID || "fb967ffb2e284be0b85b9080d8987d5f";
const token = process.env.CLOUDFLARE_API_TOKEN;
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${ns}`;
const auth = { authorization: `Bearer ${token}` };
const PORT = Number(process.env.PRERENDER_PORT || 3100);
const local = `http://127.0.0.1:${PORT}`;
// Must match cf-worker.ts
const CACHEABLE_PAGE = /^\/(fr|ar|en)(\/(visas|services|blog)(\/[a-z0-9-]+)?|\/legal\/[a-z0-9-]+|\/(pricing|faq|about|contact|track|credits))?\/?$/;
const KEPT_HEADERS = [
  "content-type", "content-language", "content-security-policy", "x-frame-options", "x-content-type-options",
  "referrer-policy", "permissions-policy", "cross-origin-opener-policy", "cross-origin-resource-policy",
  "x-permitted-cross-domain-policies", "strict-transport-security", "vary", "link",
];
const KEEP_SECONDS = 7 * 24 * 60 * 60;

// Non-secret vars of the Worker (wrangler.jsonc) so the local render matches production.
const wrangler = JSON.parse(readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));
const env = { ...process.env, ...wrangler.vars, NODE_ENV: "production", NEON_HTTP: "1", PORT: String(PORT), NEXT_TELEMETRY_DISABLED: "1" };
for (const k of ["DATABASE_URL", "SESSION_SECRET", "DOCUMENT_ENCRYPTION_KEY"]) if (!env[k]) throw new Error(`${k} is required`);

const server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], { env, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
const stop = () => server.kill("SIGTERM");
process.on("exit", stop);

try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${local}/robots.txt`)).ok) break;
    } catch {}
    if (i > 60) throw new Error("next start did not come up:\n" + log.slice(-2000));
    await new Promise((r) => setTimeout(r, 1000));
  }
  const cvRes = await fetch(`${api}/values/pagecache:content-version`, { headers: auth, signal: AbortSignal.timeout(30_000) });
  const cv = cvRes.ok ? (await cvRes.text()) || "0" : "0";
  const xml = await (await fetch(`${local}/sitemap.xml`, { signal: AbortSignal.timeout(90_000) })).text();
  const paths = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "")))].filter((p) => CACHEABLE_PAGE.test(p));
  const entries = [];
  for (const [n, p] of paths.entries()) {
    let res, body;
    for (let attempt = 1; ; attempt++) {
      try {
        res = await fetch(local + p, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
        body = await res.text();
        break;
      } catch (e) {
        if (attempt >= 3) throw new Error(`render failed for ${p}: ${e.message}`);
        console.log(`retry ${p} (${e.message})`);
      }
    }
    const type = res.headers.get("content-type") || "";
    if (res.status !== 200 || !type.startsWith("text/html") || res.headers.has("set-cookie")) {
      console.log(`skip ${res.status} ${p}`);
      continue;
    }
    const h = {};
    for (const name of KEPT_HEADERS) if (res.headers.get(name)) h[name] = res.headers.get(name);
    h["cache-control"] = "private, no-cache";
    entries.push({ key: `pc2:${version}:${p || "/"}`, value: `${JSON.stringify({ h, cv, t: Date.now() })}\n${body}`, expiration_ttl: KEEP_SECONDS });
    console.log(`${n + 1}/${paths.length} ${p}`);
  }
  console.log(`rendered ${entries.length}/${paths.length} pages locally`);
  for (let i = 0; i < entries.length; i += 40) {
    const r = await fetch(`${api}/bulk`, { method: "PUT", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(entries.slice(i, i + 40)), signal: AbortSignal.timeout(120_000) });
    const j = await r.json();
    if (!j.success) throw new Error("KV bulk write failed: " + JSON.stringify(j.errors));
  }
  console.log(`page cache filled for version ${version} (content version ${cv})`);
} finally {
  stop();
}
