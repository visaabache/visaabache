import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n/config";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, services, articles, legal] = await Promise.all([
    prisma.country.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.article.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    prisma.legalPage.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const paths: { path: string; lastModified?: Date; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/visas", priority: 0.9 },
    { path: "/services", priority: 0.9 },
    { path: "/pricing", priority: 0.8 },
    { path: "/apply", priority: 0.8 },
    { path: "/blog", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/about", priority: 0.5 },
    { path: "/track", priority: 0.4 },
    ...countries.map((c) => ({ path: `/visas/${c.slug}`, lastModified: c.updatedAt, priority: 0.9 })),
    ...services.map((s) => ({ path: `/services/${s.slug}`, lastModified: s.updatedAt, priority: 0.7 })),
    ...articles.map((a) => ({ path: `/blog/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
    ...legal.map((l) => ({ path: `/legal/${l.slug}`, lastModified: l.updatedAt, priority: 0.2 })),
  ];
  return paths.flatMap((p) =>
    locales.map((l) => ({
      url: appUrl(`/${l}${p.path}`),
      lastModified: p.lastModified ?? new Date(),
      priority: p.priority,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, appUrl(`/${x}${p.path}`)])) },
    })),
  );
}
