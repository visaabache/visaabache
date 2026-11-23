/**
 * Applies the sentence replacements of scripts/content/legal-independent.json to the legal pages (LegalPage) and
 * bumps their version. Each replacement is applied only if the original sentence is still present (pages edited
 * in the admin are left as they are). Works with Neon (HTTP driver) and plain Postgres URLs.
 *   DATABASE_URL=… node scripts/legal-update.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { neon, neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

const dry = process.argv.includes("--dry-run");
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

const { replacements } = JSON.parse(readFileSync(new URL("./content/legal-independent.json", import.meta.url), "utf8"));
const VERSION = "2026-11.2";
let missing = 0;
for (const [slug, byLocale] of Object.entries(replacements)) {
  const rows = await query(`SELECT content FROM "LegalPage" WHERE slug = $1`, [slug]);
  if (!rows.length) {
    console.log(`- ${slug}: page not found`);
    continue;
  }
  const content = { ...rows[0].content };
  let changed = 0;
  for (const [locale, pairs] of Object.entries(byLocale)) {
    let text = content[locale] || "";
    for (const [from, to] of pairs) {
      if (text.includes(from)) {
        text = text.replace(from, to);
        changed++;
      } else if (!text.includes(to) || !to) {
        missing++;
        console.log(`  ! ${slug}[${locale}] sentence not found: ${from.slice(0, 70)}…`);
      }
    }
    content[locale] = text;
  }
  if (changed && !dry) {
    await query(`UPDATE "LegalPage" SET content = $1::jsonb, version = $2, "updatedAt" = now() WHERE slug = $3`, [JSON.stringify(content), VERSION, slug]);
  }
  console.log(`${dry ? "(dry run) " : ""}${slug}: ${changed} change(s)`);
}
// FAQ answers (any FAQ whose answer still contains the original sentence)
const { faqAnswers = {} } = JSON.parse(readFileSync(new URL("./content/legal-independent.json", import.meta.url), "utf8"));
const faqs = await query(`SELECT id, answer FROM "Faq"`);
for (const f of faqs) {
  const answer = { ...f.answer };
  let changed = 0;
  for (const [locale, pairs] of Object.entries(faqAnswers)) {
    for (const [from, to] of pairs) {
      if ((answer[locale] || "").includes(from)) {
        answer[locale] = answer[locale].replace(from, to);
        changed++;
      }
    }
  }
  if (changed && !dry) await query(`UPDATE "Faq" SET answer = $1::jsonb, "updatedAt" = now() WHERE id = $2`, [JSON.stringify(answer), f.id]);
  if (changed) console.log(`${dry ? "(dry run) " : ""}faq ${f.id}: ${changed} change(s)`);
}
console.log(missing ? `${missing} sentence(s) not found (already changed or edited in the admin)` : "all sentences found");
process.exit(0);
