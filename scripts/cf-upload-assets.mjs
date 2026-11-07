/**
 * Uploads the static build output (.open-next/assets) to a Workers KV namespace, served by cf-worker.ts.
 *
 * Why KV instead of Workers Static Assets: the native asset upload authenticates with a short-lived upload
 * token, which some proxied/CI environments overwrite with the API token. KV writes use the API token itself.
 * Only keys that are not already present are written (content-hashed `_next/static` files never change),
 * which keeps deployments well within the free plan's 1,000 KV writes/day.
 *
 *   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… STATIC_KV_ID=… node scripts/cf-upload-assets.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const ns = process.env.STATIC_KV_ID;
if (!account || !token || !ns) throw new Error("CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and STATIC_KV_ID are required");

const root = join(process.cwd(), ".open-next", "assets");
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${ns}`;
const headers = { Authorization: `Bearer ${token}` };

const TYPES = {
  ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".map": "application/json", ".html": "text/html; charset=utf-8", ".xml": "application/xml",
};

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function cf(path, init = {}) {
  const res = await fetch(api + path, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(`${init.method || "GET"} ${path} → ${res.status} ${JSON.stringify(body.errors || body).slice(0, 300)}`);
  return body;
}

// Existing keys
const existing = new Set();
let cursor = "";
do {
  const r = await cf(`/keys?limit=1000${cursor ? `&cursor=${cursor}` : ""}`);
  r.result.forEach((k) => existing.add(k.name));
  cursor = r.result_info?.cursor || "";
} while (cursor);

const files = walk(root).map((p) => ({ path: p, key: "/" + relative(root, p).split("\\").join("/") }));
// BUILD_ID changes on every build and is tiny: always refresh it; skip other files already uploaded.
const todo = files.filter((f) => f.key === "/BUILD_ID" || !existing.has(f.key));
console.log(`${files.length} assets, ${todo.length} to upload`);

for (let i = 0; i < todo.length; i += 100) {
  const batch = todo.slice(i, i + 100).map((f) => ({
    key: f.key,
    value: readFileSync(f.path).toString("base64"),
    base64: true,
    metadata: { ct: TYPES[extname(f.path).toLowerCase()] || "application/octet-stream" },
  }));
  await cf("/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch) });
  console.log(`  uploaded ${Math.min(i + 100, todo.length)}/${todo.length}`);
}
console.log("Static assets up to date.");
