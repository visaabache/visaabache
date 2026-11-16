import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entry = (path: string, lastModified?: Date, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${base}/fr${path}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])) },
  });
  const [products, categories, collections, pages] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  return [
    entry("", undefined, 1),
    entry("/shop", undefined, 0.9),
    entry("/collections", undefined, 0.7),
    entry("/gifts", undefined, 0.7),
    entry("/craftsmanship", undefined, 0.5),
    ...products.map((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.8)),
    ...categories.map((c) => entry(`/category/${c.slug}`, c.updatedAt, 0.7)),
    ...collections.map((c) => entry(`/collections/${c.slug}`, c.updatedAt, 0.6)),
    ...pages.map((p) => entry(`/pages/${p.slug}`, p.updatedAt, 0.3)),
  ];
}
