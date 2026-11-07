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

// Local devDependency first; falls back to a global install (resolved through NODE_PATH).
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@visaabache.ma";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
const pdf = join(mkdtempSync(join(tmpdir(), "va-e2e-")), "passport.pdf");
writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

let failures = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n    ${String(e.message).split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
const errors = [];

console.log("Public site");
const pub = await browser.newPage();
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
const customer = await browser.newPage({ viewport: { width: 1280, height: 900 } });
customer.on("pageerror", (e) => errors.push(`${customer.url()}: ${e.message.slice(0, 120)}`));
const email = `e2e${Date.now()}@example.com`;
let reference = "";
await step("apply wizard (account, checklist, upload, package, submit)", async () => {
  await customer.goto(BASE + "/fr/apply?country=france");
  await customer.click("text=Tout accepter").catch(() => {});
  await customer.click('button:has-text("Court séjour — Tourisme")');
  await customer.fill('input[autocomplete="given-name"]', "Test");
  await customer.fill('input[autocomplete="family-name"]', "Client");
  await customer.fill('input[type="email"]', email);
  await customer.fill('input[type="tel"]', "0612345678");
  await customer.fill('input[type="password"]', "Password12345");
  await customer.check("fieldset input[type=checkbox]");
  await customer.click('button:has-text("Continuer")');
  await customer.selectOption("select", "employed");
  for (const b of await customer.$$('button:has-text("Non")')) await b.click();
  await customer.click('button:has-text("Continuer")');
  await customer.waitForSelector("text=Attestation de travail");
  await customer.click('button:has-text("Enregistrer et continuer")');
  await customer.waitForSelector("text=Téléversez vos documents");
  await (await customer.$("input[type=file]")).setInputFiles(pdf);
  await customer.waitForSelector("text=Téléversé");
  await customer.click('button:has-text("Continuer")');
  await customer.click('button:has-text("Assistance visa standard")');
  await customer.click('button:has-text("Continuer")');
  for (const cb of await customer.$$("input[type=checkbox]")) await cb.check();
  await customer.click('[data-testid="submit-application"]');
  await customer.waitForSelector('[data-testid="reference"]', { timeout: 20000 });
  reference = (await customer.textContent('[data-testid="reference"]')).trim();
  if (!/^VA-\d{2}-[A-Z0-9]{6}$/.test(reference)) throw new Error(`bad reference ${reference}`);
});
await step("dashboard shows unpaid invoice", async () => {
  await customer.goto(BASE + "/fr/account/invoices");
  await customer.waitForSelector("text=À payer");
});
await step("public tracking by reference + email", async () => {
  await customer.goto(BASE + "/fr/track");
  await customer.fill("input[name=reference]", reference);
  await customer.fill("input[name=email]", email);
  await customer.click('button:has-text("Suivre")');
  await customer.waitForSelector("text=Nouvelle demande");
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
  const admin = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  admin.on("pageerror", (e) => errors.push(`${admin.url()}: ${e.message.slice(0, 120)}`));
  admin.on("dialog", (d) => d.accept());
  await step("login as owner", async () => {
    await admin.goto(BASE + "/fr/login");
    await admin.fill("#email", ADMIN_EMAIL);
    await admin.fill("#password", ADMIN_PASSWORD);
    await admin.click("button[type=submit]");
    await admin.waitForURL("**/admin");
  });
  await step("customer is redirected away from admin", async () => {
    await customer.goto(BASE + "/fr/admin");
    if (!customer.url().includes("/account")) throw new Error("customer reached admin");
  });
  await step("all admin sections load", async () => {
    for (const p of ["", "/applications", "/customers", "/inquiries", "/support", "/payments", "/invoices", "/invoices/new", "/reports", "/countries", "/countries/questions", "/services", "/services/new", "/packages", "/statuses", "/articles", "/articles/new", "/faqs", "/legal", "/testimonials", "/banners", "/discounts", "/templates", "/settings", "/users", "/compliance", "/automation", "/audit"]) {
      const r = await admin.goto(BASE + "/fr/admin" + p);
      if (r.status() !== 200) throw new Error(`${p} → ${r.status()}`);
    }
  });
  await step("change status, request documents, record payment", async () => {
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
  await step("customer sees requested documents and paid invoice", async () => {
    await customer.goto(BASE + "/fr/account/applications");
    await customer.click(`text=${reference}`);
    await customer.waitForSelector("text=Documents demandés par votre conseiller");
    await customer.goto(BASE + "/fr/account/invoices");
    await customer.waitForSelector("text=Payée");
  });
  await step("run automations", async () => {
    await admin.goto(BASE + "/fr/admin/automation");
    await admin.click('button:has-text("Lancer les automatisations")');
    await admin.waitForSelector("text=documentReminders");
  });
}

await browser.close();
if (errors.length) {
  failures++;
  console.log("Browser errors:", errors);
}
console.log(failures ? `\n${failures} failure(s)` : "\nAll E2E checks passed");
process.exit(failures ? 1 : 0);
