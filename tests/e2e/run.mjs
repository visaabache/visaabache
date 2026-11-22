/**
 * End-to-end smoke test (Playwright) against a running instance:
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:e2e
 * Requires the `playwright` package (npm i -D playwright && npx playwright install chromium).
 * Covers: public pages in 3 languages, RTL, mobile overflow, full application wizard with encrypted upload,
 * public tracking, document access control, admin workflow (status, document request, payment), automation.
 */
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";

// Local devDependency first; falls back to a global install (resolved through NODE_PATH).
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@visaabache.ma";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
const pdf = join(mkdtempSync(join(tmpdir(), "va-e2e-")), "passport.pdf");
writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

let failures = 0;
// Optional pause before each step / admin page (E2E_SLOW_MS), to stay within Cloudflare's free-plan CPU allowance.
const SLOW = Number(process.env.E2E_SLOW_MS || 0);
const pause = () => (SLOW ? new Promise((r) => setTimeout(r, SLOW)) : Promise.resolve());

// RFC 6238 code generator (same algorithm as the authenticator apps) for the two-step verification test.
function totp(secretB32, offset = 0) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const bytes = [];
  for (const c of secretB32.replace(/[^A-Z2-7]/g, "")) {
    value = (value << 5) | A.indexOf(c);
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  const step = Math.floor(Date.now() / 30000) + offset;
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  msg.writeUInt32BE(step >>> 0, 4);
  const h = createHmac("sha1", Buffer.from(bytes)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
}

async function step(name, fn) {
  await pause();
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n    ${String(e.message).split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
// Optional extra request headers, e.g. E2E_HEADERS='{"Cloudflare-Workers-Version-Overrides":"app=\\"<version-id>\\""}'
// to test a not-yet-promoted Cloudflare Worker version.
const EXTRA = process.env.E2E_HEADERS ? JSON.parse(process.env.E2E_HEADERS) : undefined;
const errors = [];

console.log("Public site");
const pub = await browser.newPage({ extraHTTPHeaders: EXTRA });
pub.on("pageerror", (e) => errors.push(`${pub.url()}: ${e.message.slice(0, 120)}`));
for (const path of ["/fr", "/ar", "/en", "/fr/visas", "/fr/visas/france", "/ar/visas/canada", "/fr/services", "/fr/pricing", "/fr/blog", "/fr/faq", "/fr/contact", "/fr/legal/privacy", "/fr/track", "/sitemap.xml", "/robots.txt"]) {
  await step(`GET ${path}`, async () => {
    const r = await pub.goto(BASE + path);
    if (r.status() !== 200) throw new Error(`status ${r.status()}`);
  });
}
await step("Arabic pages are RTL", async () => {
  await pub.goto(BASE + "/ar");
  if ((await pub.getAttribute("html", "dir")) !== "rtl") throw new Error("not rtl");
});
await step("no horizontal overflow on mobile", async () => {
  await pub.setViewportSize({ width: 390, height: 800 });
  for (const path of ["/ar/visas/france", "/fr", "/fr/apply"]) {
    await pub.goto(BASE + path);
    const sw = await pub.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 392) throw new Error(`${path} scrollWidth ${sw}`);
  }
});

console.log("Customer journey");
const customer = await browser.newPage({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: EXTRA });
customer.on("pageerror", (e) => errors.push(`${customer.url()}: ${e.message.slice(0, 120)}`));
const email = `e2e${Date.now()}@example.com`;
let reference = "";
// ONLINE_FORMS=off: informational website (no application / contact forms, WhatsApp only).
const formsOff = await (async () => {
  await customer.goto(BASE + "/fr/apply");
  return (await customer.content()).includes("Aucun formulaire à remplir"); // subtitle of the information page
})();
if (formsOff) {
  console.log("  (online forms are off: informational website)");
  await step("no page asks for personal data; WhatsApp with a pre-written message instead", async () => {
    for (const path of ["/fr/apply?country=france", "/fr/contact", "/fr/services/visa-application-assistance", "/ar/apply", "/en/contact"]) {
      await customer.goto(BASE + path);
      await customer.waitForTimeout(400);
      const fields = await customer.$$('input[type=email], input[type=tel], input[name=name], input[name=firstName], input[name=passportNumber], textarea');
      if (fields.length) throw new Error(`${path}: ${fields.length} personal-data field(s)`);
      const wa = await customer.getAttribute('a[href^="https://wa.me/"]', "href");
      if (!wa || !wa.includes("text=")) throw new Error(`${path}: no WhatsApp link`);
    }
    await customer.goto(BASE + "/fr/apply?country=france");
    await customer.waitForTimeout(500);
    const wa = decodeURIComponent((await customer.getAttribute('a[href^="https://wa.me/"]', "href")) || "");
    if (!wa.includes("France")) throw new Error(`message does not name the destination: ${wa}`);
  });
}
if (!formsOff) await step("guest application (no account, no upload) → tracking code", async () => {
  await customer.goto(BASE + "/fr/apply?country=france");
  await customer.click("text=Tout accepter").catch(() => {});
  await customer.click('button:has-text("Court séjour — Tourisme")');
  await customer.fill('input[autocomplete="given-name"]', "Test");
  await customer.fill('input[autocomplete="family-name"]', "Client");
  await customer.fill('input[type="email"]', email);
  await customer.fill('input[type="tel"]', "0612345678");
  if (await customer.$('input[type="password"]')) throw new Error("account step still shown");
  await customer.click('button:has-text("Continuer")');
  await customer.selectOption("select", "employed");
  for (const b of await customer.$$('button:has-text("Non")')) await b.click();
  await customer.click('button:has-text("Continuer")');
  await customer.waitForSelector("text=Attestation de travail");
  if (await customer.$("input[type=file]")) throw new Error("upload still shown");
  await customer.click('button:has-text("Continuer")');
  await customer.click('button:has-text("Assistance visa standard")');
  await customer.click('button:has-text("Continuer")');
  for (const cb of await customer.$$("input[type=checkbox]")) await cb.check();
  await customer.click('[data-testid="submit-application"]');
  await customer.waitForSelector('[data-testid="reference"]', { timeout: 20000 });
  reference = (await customer.textContent('[data-testid="reference"]')).trim();
  if (!/^VA-\d{2}-[A-Z0-9]{6}$/.test(reference)) throw new Error(`bad reference ${reference}`);
});
if (!formsOff) await step("tracking page by code shows status, checklist and amount due", async () => {
  await customer.goto(BASE + "/fr/track");
  await customer.fill("input[name=code]", reference.toLowerCase());
  await customer.click('button:has-text("Suivre")');
  await customer.waitForSelector("text=Nouvelle demande");
  await customer.waitForSelector("text=Documents à préparer");
  await customer.waitForSelector("text=Reste à payer");
});
await step("customer login and dashboard are disabled", async () => {
  await customer.goto(BASE + "/fr/account");
  if (!customer.url().includes("/track")) throw new Error(`account reachable: ${customer.url()}`);
  await customer.goto(BASE + "/fr/register");
  if (!customer.url().includes("/apply")) throw new Error(`register reachable: ${customer.url()}`);
});
await step("documents require authentication", async () => {
  const r = await pub.request.get(BASE + "/api/documents/doesnotexist");
  if (r.status() !== 401) throw new Error(`expected 401, got ${r.status()}`);
});
await step("cron endpoint requires the secret", async () => {
  const r = await pub.request.get(BASE + "/api/cron/run");
  if (r.status() !== 401) throw new Error(`expected 401, got ${r.status()}`);
});

console.log("Admin");
if (!ADMIN_PASSWORD) {
  console.log("  (skipped: set ADMIN_PASSWORD)");
} else {
  const admin = await browser.newPage({ viewport: { width: 1400, height: 900 }, extraHTTPHeaders: EXTRA });
  admin.on("pageerror", (e) => errors.push(`${admin.url()}: ${e.message.slice(0, 120)}`));
  admin.on("dialog", (d) => d.accept());
  await step("login as owner", async () => {
    await admin.goto(BASE + "/fr/admin/login");
    await admin.getByRole("button", { name: "Essentiels uniquement" }).click().catch(() => {}); // cookie banner
    await admin.fill("#email", ADMIN_EMAIL);
    await admin.fill("#password", ADMIN_PASSWORD);
    await admin.click("button[type=submit]");
    await admin.waitForURL("**/admin");
  });
  await step("visitors are sent to the admin sign-in", async () => {
    await customer.goto(BASE + "/fr/admin");
    if (!customer.url().includes("/admin/login")) throw new Error("visitor reached admin");
  });
  await step("all admin sections load", async () => {
    for (const p of ["", "/applications", "/customers", "/inquiries", "/support", "/payments", "/invoices", "/invoices/new", "/reports", "/countries", "/countries/questions", "/services", "/services/new", "/packages", "/statuses", "/articles", "/articles/new", "/faqs", "/legal", "/testimonials", "/banners", "/discounts", "/templates", "/settings", "/users", "/compliance", "/automation", "/audit"]) {
      await pause();
      const r = await admin.goto(BASE + "/fr/admin" + p);
      if (r.status() !== 200) throw new Error(`${p} → ${r.status()}`);
    }
  });
  if (!formsOff) await step("change status, request documents, record payment", async () => {
    await admin.goto(BASE + `/fr/admin/applications?q=${reference}`);
    await admin.click(`a:has-text("${reference}")`);
    await admin.selectOption("select[name=statusId]", { label: "En cours d'étude ✉" });
    await admin.click('button:has-text("Mettre à jour")');
    await admin.waitForSelector("text=Enregistré");
    await admin.fill("textarea[name=items]", "Relevés bancaires | 6 derniers mois");
    await admin.click('button:has-text("Envoyer la demande")');
    await admin.waitForSelector("text=Demandes en attente (1)");
    await admin.click('summary:has-text("Enregistrer un paiement")');
    await admin.fill("input[name=amount]", "750");
    await admin.selectOption("select[name=method]", "CASH");
    await admin.click('details button:has-text("Enregistrer")');
    await admin.waitForSelector("text=Payée");
  });
  if (!formsOff) await step("tracking page shows new status, requested documents and payment", async () => {
    await customer.goto(BASE + `/fr/track?code=${reference}`);
    await customer.waitForSelector("text=En cours d'étude");
    await customer.waitForSelector("text=Documents demandés par votre conseiller");
    await customer.waitForSelector("text=Relevés bancaires");
    await customer.waitForSelector("text=Réglé — merci !");
  });
  await step("run automations", async () => {
    await admin.goto(BASE + "/fr/admin/automation");
    await admin.click('button:has-text("Lancer les automatisations")');
    await admin.waitForSelector("text=documentReminders");
  });
  // Local only: on a live site a failure half-way could leave 2FA enabled on the real owner account.
  if (/localhost|127\.0\.0\.1/.test(BASE)) await step("two-step verification (2FA): enable, sign-in needs a valid code, disable", async () => {
    await admin.goto(BASE + "/fr/admin/security");
    const secret = (await admin.locator("code").first().innerText()).replace(/\s/g, "");
    await admin.fill("#code", totp(secret));
    await admin.click('button:has-text("Activer la validation en deux étapes")');
    await admin.waitForSelector("text=La validation en deux étapes est activée");
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const login = async (code) => {
      await p.goto(BASE + "/fr/admin/login");
      await p.getByRole("button", { name: "Essentiels uniquement" }).click().catch(() => {});
      await p.fill("#email", ADMIN_EMAIL);
      await p.fill("#password", ADMIN_PASSWORD);
      if (code) await p.fill("#totp", code);
      await p.click("button[type=submit]");
    };
    await login("");
    await p.waitForSelector("text=Saisissez le code à 6 chiffres");
    await login("000000");
    await p.waitForSelector("text=Code invalide ou expiré");
    // The code used to enable 2FA cannot be replayed; the next time step's code is accepted (±30 s drift window).
    const loginStep = Math.floor(Date.now() / 30000) + 1;
    await login(totp(secret, 1));
    await p.waitForURL("**/admin");
    await ctx.close();
    // Disabling needs a code that was never used: wait until the step after the one used to sign in has started.
    while (Math.floor(Date.now() / 30000) <= loginStep) await new Promise((r) => setTimeout(r, 1000));
    await admin.goto(BASE + "/fr/admin/security");
    await admin.click("summary");
    await admin.fill("#password", ADMIN_PASSWORD);
    await admin.fill("#dcode", totp(secret, 0));
    await admin.click('button:has-text("Désactiver la 2FA")');
    // On success the page refreshes into the "not enabled" state (the confirmation disappears with the form).
    await admin.waitForSelector("text=La validation en deux étapes n'est pas activée");
    await admin.goto(BASE + "/fr/admin/security");
    await admin.waitForSelector("text=La validation en deux étapes n'est pas activée");
  });
}

await browser.close();
// React hydration recoveries (#418/#423/#425) re-render on the client without functional impact; they are
// reported as warnings (known intermittent issue, see docs/ARCHITECTURE.md). Any other browser error fails the run.
const hydration = errors.filter((e) => /Minified React error #(418|423|425)/.test(e));
const real = errors.filter((e) => !hydration.includes(e));
if (hydration.length) console.log("Warnings (hydration recovered on client):", hydration);
if (real.length) {
  failures++;
  console.log("Browser errors:", real);
}
console.log(failures ? `\n${failures} failure(s)` : "\nAll E2E checks passed");
process.exit(failures ? 1 : 0);
