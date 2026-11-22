/**
 * Publishes the SEO guides of scripts/content/seo-articles.json (upsert by slug) and, when the homepage title /
 * description are still the initial defaults, replaces them with search-oriented ones. Never overwrites a homepage
 * title or description edited in the admin. Works with Neon (HTTP driver) and plain Postgres URLs alike.
 *   DATABASE_URL=… node scripts/seo-content.mjs
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
let query;
if (/\.neon\.tech/.test(url)) {
  neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;
  const sql = neon(url);
  query = (text, params = []) => sql.query(text, params);
} else {
  const prisma = new PrismaClient();
  query = (text, params = []) => prisma.$queryRawUnsafe(text, ...params);
}

const articles = JSON.parse(readFileSync(new URL("./content/seo-articles.json", import.meta.url), "utf8"));
for (const a of articles) {
  const existing = await query(`SELECT id FROM "Article" WHERE slug = $1`, [a.slug]);
  const values = [JSON.stringify(a.title), JSON.stringify(a.excerpt), JSON.stringify(a.content), a.coverImageUrl, a.tags, JSON.stringify(a.seoTitle), JSON.stringify(a.seoDescription), a.category];
  if (existing.length) {
    await query(
      `UPDATE "Article" SET title=$1::jsonb, excerpt=$2::jsonb, content=$3::jsonb, "coverImageUrl"=$4, tags=$5::text[], "seoTitle"=$6::jsonb, "seoDescription"=$7::jsonb, category=$8::"ArticleCategory", "updatedAt"=now() WHERE slug=$9`,
      [...values, a.slug],
    );
    console.log("updated", a.slug);
  } else {
    await query(
      `INSERT INTO "Article" (id, slug, title, excerpt, content, "coverImageUrl", tags, "seoTitle", "seoDescription", category, "authorName", "isPublished", "publishedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7::text[], $8::jsonb, $9::jsonb, $10::"ArticleCategory", 'VISA ABACHE', true, now(), now(), now())`,
      [randomUUID().replace(/-/g, "").slice(0, 25), a.slug, ...values],
    );
    console.log("published", a.slug);
  }
}

// Homepage <title> and description (Settings "seo"), only if still the initial defaults.
const DEFAULT_TITLE_FR = "VISA ABACHE — Assistance visa & services administratifs au Maroc";
const NEW = {
  siteTitle: {
    fr: "Agence visa au Maroc : Schengen, France, Espagne, USA, Canada | VISA ABACHE",
    ar: "فيزا شنغن، فرنسا، إسبانيا، أمريكا وكندا من المغرب | VISA ABACHE",
    en: "Visa assistance in Morocco: Schengen, France, Spain, USA, Canada | VISA ABACHE",
  },
  siteDescription: {
    fr: "Assistance visa touristique depuis le Maroc : Schengen (France, Espagne, Italie…), USA, Canada, Royaume-Uni. Documents, rendez-vous et conseils d'un conseiller sur WhatsApp. Prestataire indépendant.",
    ar: "مساعدة في التأشيرة السياحية من المغرب: شنغن (فرنسا، إسبانيا، إيطاليا…)، أمريكا، كندا، بريطانيا. الوثائق، الموعد ونصائح مستشار عبر واتساب. مقدم خدمة مستقل.",
    en: "Tourist visa assistance from Morocco: Schengen (France, Spain, Italy…), USA, Canada, UK. Documents, appointments and advice from an advisor on WhatsApp. Independent provider.",
  },
};
const rows = await query(`SELECT value FROM "Setting" WHERE key = 'seo'`);
if (rows.length) {
  const seo = rows[0].value;
  const titleFr = seo?.siteTitle?.fr || "";
  if (!titleFr || titleFr === DEFAULT_TITLE_FR) {
    const next = { ...seo, siteTitle: NEW.siteTitle, siteDescription: NEW.siteDescription };
    await query(`UPDATE "Setting" SET value = $1::jsonb, "updatedAt" = now() WHERE key = 'seo'`, [JSON.stringify(next)]);
    console.log("homepage title and description updated");
  } else {
    console.log("homepage title was customised in the admin: left unchanged");
  }
}
process.exit(0);
