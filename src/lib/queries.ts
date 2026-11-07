import "server-only";
import { prisma } from "./db";

export async function activeCountries() {
  return prisma.country.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] });
}

export async function packagesForCountry(slug?: string | null) {
  const now = new Date();
  const all = await prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return all.filter(
    (p) => (!p.countrySlugs.length || (slug && p.countrySlugs.includes(slug))) && (!p.isPromotional || !p.promoEndsAt || p.promoEndsAt > now),
  );
}

export async function publishedTestimonials(limit = 6) {
  return prisma.testimonial.findMany({
    where: { isPublished: true, isVerified: true, consentToPublish: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { country: true },
  });
}
