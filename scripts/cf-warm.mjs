/**
 * Re-fills the Cloudflare page cache after a deploy: requests every page of the sitemap one at a time, with a
 * pause between requests so the Workers Free CPU allowance is never exhausted (a burst of uncached renders is what
 * causes error 1102). Each page then costs a few ms of CPU for every visitor.
 *   node scripts/cf-warm.mjs [https://visaabache.site] [pause-ms=4000]
 */
const base = (process.argv[2] || process.env.APP_URL || "https://visaabache.site").replace(/\/$/, "");
const pause = Number(process.argv[3] || 4000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, base));
// The most visited pages first.
const rank = (u) => (/\/(fr|ar|en)$/.test(u) ? 0 : /\/fr\//.test(u) ? 1 : 2);
urls.sort((a, b) => rank(a) - rank(b));
let ok = 0, failed = 0;
for (const [i, u] of urls.entries()) {
  try {
    const res = await fetch(u, { headers: { "user-agent": "VisaAbacheCacheWarmer/1.0" }, redirect: "manual" });
    await res.arrayBuffer();
    const state = res.headers.get("x-page-cache") || "-";
    if (res.status === 200) ok++;
    else failed++;
    console.log(`${String(i + 1).padStart(3)}/${urls.length} ${res.status} ${state.padEnd(5)} ${u}`);
    // Already cached: no render happened, no need to wait as long.
    await sleep(state === "HIT" ? 300 : res.status === 200 ? pause : pause * 3);
  } catch (e) {
    failed++;
    console.log(`${i + 1}/${urls.length} ERROR ${u} ${e.message}`);
    await sleep(pause * 3);
  }
}
console.log(`done: ${ok} ok, ${failed} failed`);
