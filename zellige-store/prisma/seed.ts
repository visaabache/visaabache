/**
 * Seeds reference data. Idempotent and non-destructive: existing rows (matched by slug, SKU, code…) are never overwritten,
 * so it is safe to run again after you have edited content in the admin.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categories, cities, collections, currencies, products, zones } from "./seed-data";
import { pages } from "./seed-pages";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters");
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({ data: { email, name: "Owner", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } });
      console.log(`✓ Owner account ${email}`);
    } else if (exists.role !== "ADMIN") {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log(`✓ ${email} promoted to owner`);
    }
  } else console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no owner account created (use npm run admin:create)");

  for (const c of currencies) await prisma.currency.upsert({ where: { code: c.code }, create: c, update: {} });

  const catIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const top = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description, image: c.image, sortOrder: i },
      update: {},
    });
    catIds.set(c.slug, top.id);
    for (const [j, s] of c.children.entries()) {
      const sub = await prisma.category.upsert({ where: { slug: s.slug }, create: { slug: s.slug, name: s.name, parentId: top.id, sortOrder: j }, update: {} });
      catIds.set(s.slug, sub.id);
    }
  }

  let created = 0;
  const now = Date.now();
  for (const [i, p] of products.entries()) {
    if (await prisma.product.findUnique({ where: { sku: p.sku }, select: { id: true } })) continue;
    await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        status: "PUBLISHED",
        publishedAt: new Date(now - i * 3600_000),
        name: p.name,
        shortDescription: p.short,
        description: p.description,
        materials: p.materials,
        care: p.care,
        craftType: "UNSPECIFIED",
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        stock: p.stock,
        colors: p.colors,
        patterns: p.patterns,
        featured: !!p.featured,
        giftable: !!p.giftable,
        personalizable: !!p.personalizable,
        categoryId: catIds.get(p.category) ?? null,
        images: { create: p.images.map((url, k) => ({ url, alt: p.name, width: url.includes("display") ? 1600 : 1200, height: url.includes("display") ? 1200 : 1600, sortOrder: k })) },
        variants: p.variants ? { create: p.variants.map((v, k) => ({ sku: v.sku, name: v.name, pattern: v.pattern, color: v.color, stock: v.stock, price: v.price ?? null, sortOrder: k })) } : undefined,
      },
    });
    created++;
  }
  console.log(`✓ ${created} products created (${products.length - created} already present)`);

  for (const [i, c] of collections.entries()) {
    if (await prisma.collection.findUnique({ where: { slug: c.slug } })) continue;
    const ids = await prisma.product.findMany({ where: { sku: { in: c.products } }, select: { id: true, sku: true } });
    await prisma.collection.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        image: c.image,
        featured: c.featured,
        isGift: c.isGift,
        sortOrder: i,
        products: { create: c.products.map((sku) => ids.find((x) => x.sku === sku)).filter(Boolean).map((x, k) => ({ productId: x!.id, sortOrder: k })) },
      },
    });
  }

  if ((await prisma.shippingCity.count()) === 0) {
    await prisma.shippingCity.createMany({ data: cities.map(([fr, ar, en, region, fee, minDays, maxDays], i) => ({ name: { fr, ar, en }, region, fee: fee * 100, minDays, maxDays, sortOrder: i })) });
    console.log(`✓ ${cities.length} Moroccan cities (placeholder fees)`);
  }
  if ((await prisma.shippingZone.count()) === 0) {
    await prisma.shippingZone.createMany({ data: zones.map((z, i) => ({ ...z, sortOrder: i })) });
    console.log(`✓ ${zones.length} international zones (placeholder fees)`);
  }

  await prisma.discountCode.upsert({ where: { code: "BIENVENUE10" }, create: { code: "BIENVENUE10", type: "PERCENT", value: 10, minSubtotal: 15000 }, update: {} });

  for (const p of pages) await prisma.page.upsert({ where: { slug: p.slug }, create: p, update: {} });
  console.log(`✓ ${pages.length} pages`);
  console.log("Done. Prices, stock, delivery fees and exchange rates are placeholders: review them in the admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
