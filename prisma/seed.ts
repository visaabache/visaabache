/* eslint-disable no-console */
/**
 * Seeds reference data. Idempotent: existing records (matched by slug/key) are NOT overwritten,
 * so it is safe to re-run after the owner has edited content in the admin panel.
 *   npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { countries, schengenTexts, genericTexts } from "./seed-data/countries";
import { checklistFor, globalQuestions } from "./seed-data/checklists";
import { services, packages, generalFaqs } from "./seed-data/services";
import { statuses, templates } from "./seed-data/templates";
import { legalPages, articles } from "./seed-data/legal";

// Neon (serverless Postgres) is reached over its HTTPS/WebSocket driver; other databases over TCP.
const prisma = /\.neon\.tech/.test(process.env.DATABASE_URL || "")
  ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) })
  : new PrismaClient();
const J = (v: unknown) => v as Prisma.InputJsonValue;

async function main() {
  // Statuses
  for (const [i, s] of statuses.entries()) {
    await prisma.applicationStatus.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key, label: J(s.label), description: J(s.description), color: s.color, kind: s.kind, sortOrder: i,
        isInitial: "initial" in s ? Boolean(s.initial) : false, notifyCustomer: true,
      },
    });
  }
  console.log(`✓ ${statuses.length} statuses`);

  // Global wizard questions
  for (const [i, q] of globalQuestions.entries()) {
    const existing = await prisma.question.findFirst({ where: { countryId: null, key: q.key } });
    if (!existing) {
      await prisma.question.create({
        data: { key: q.key, type: q.type, label: J(q.label), options: "options" in q ? J(q.options) : undefined, required: true, sortOrder: i, visaTypeCodes: [] },
      });
    }
  }

  // Countries
  for (const [i, c] of countries.entries()) {
    const exists = await prisma.country.findUnique({ where: { slug: c.slug } });
    if (exists) continue;
    const texts = c.schengen ? schengenTexts : genericTexts;
    const codes = c.visaTypes.map((v) => v.code);
    const country = await prisma.country.create({
      data: {
        slug: c.slug, isoCode: c.iso, name: J(c.name), region: c.region, isSchengen: Boolean(c.schengen), isPopular: Boolean(c.popular), sortOrder: i,
        summary: J(texts.summary), eligibility: J(texts.eligibility), procedure: J(texts.procedure), appointmentInfo: J(texts.appointment),
        processingInfo: "processing" in texts ? J(texts.processing) : undefined, officialFeesInfo: J(texts.fees),
        seoTitle: c.seoKeyword ? J({
          fr: `${c.seoKeyword.fr} — assistance dossier & rendez-vous`,
          ar: `${c.seoKeyword.ar} — مساعدة في الملف والموعد`,
          en: `${c.seoKeyword.en} — application assistance`,
        }) : undefined,
        visaTypes: { create: c.visaTypes.map((v, j) => ({ code: v.code, name: J(v.name), sortOrder: j })) },
        links: { create: c.links.map((l, j) => ({ label: J(l.label), url: l.url, type: l.type, sortOrder: j })) },
        checklistItems: {
          create: checklistFor(Boolean(c.schengen), codes).map((it, j) => ({
            title: J(it.title), description: it.description ? J(it.description) : undefined, required: it.required ?? true,
            visaTypeCodes: it.visaTypeCodes ?? [], condition: it.condition ? J(it.condition) : undefined, sortOrder: j,
          })),
        },
      },
    });
    void country;
  }
  console.log(`✓ ${countries.length} destinations`);

  // Services
  for (const [i, s] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug, category: s.category, icon: s.icon, name: J(s.name), shortDescription: J(s.short), description: J(s.short),
        features: J(s.features), priceType: s.priceType, price: s.price ?? null, isFeatured: Boolean(s.featured), sortOrder: i,
        disclaimer: s.disclaimer ? J(s.disclaimer) : undefined,
      },
    });
  }
  console.log(`✓ ${services.length} services`);

  for (const p of packages) {
    await prisma.package.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, name: J(p.name), description: J(p.description), features: J(p.features), price: p.price, sortOrder: p.sortOrder, isHighlighted: Boolean(p.highlighted), countrySlugs: [] },
    });
  }
  console.log(`✓ ${packages.length} packages`);

  if ((await prisma.faq.count({ where: { scope: "GENERAL" } })) === 0) {
    for (const [i, f] of generalFaqs.entries()) {
      await prisma.faq.create({ data: { scope: "GENERAL", question: J(f.q), answer: J(f.a), sortOrder: i, showOnHome: f.home } });
    }
  }
  console.log(`✓ FAQs`);

  for (const p of legalPages) {
    await prisma.legalPage.upsert({ where: { slug: p.slug }, update: {}, create: { slug: p.slug, title: J(p.title), content: J(p.content), version: "2026-11" } });
  }
  console.log(`✓ legal pages`);

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: { slug: a.slug, category: a.category, title: J(a.title), excerpt: J(a.excerpt), content: J(a.content), isPublished: true, publishedAt: new Date(), tags: ["visa", "maroc"] },
    });
  }
  console.log(`✓ articles`);

  // Notification templates
  let tcount = 0;
  for (const [key, t] of Object.entries(templates)) {
    for (const locale of ["fr", "ar", "en"] as const) {
      await prisma.notificationTemplate.upsert({
        where: { key_channel_locale: { key, channel: "EMAIL", locale } },
        update: {},
        create: { key, channel: "EMAIL", locale, subject: t.subject[locale], body: t.body[locale] },
      });
      tcount++;
      if (t.whatsapp) {
        await prisma.notificationTemplate.upsert({
          where: { key_channel_locale: { key, channel: "WHATSAPP", locale } },
          update: {},
          create: { key, channel: "WHATSAPP", locale, body: t.whatsapp[locale] },
        });
        tcount++;
      }
    }
  }
  console.log(`✓ ${tcount} notification templates`);

  // First administrator (owner)
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: { email, passwordHash: await bcrypt.hash(password, 12), firstName: "Admin", lastName: "VISA ABACHE", role: "OWNER", locale: "fr" },
      });
      console.log(`✓ owner account created: ${email}`);
    } else {
      console.log(`• owner account already exists: ${email}`);
    }
  } else {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — run `npm run admin:create` to create the owner account");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
