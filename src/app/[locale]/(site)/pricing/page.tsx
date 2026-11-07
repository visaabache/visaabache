import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { packagesForCountry } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PackageCard, PageHero, ServiceCard } from "@/components/site/cards";
import { Alert, SectionHeading } from "@/components/ui/misc";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/pricing", title: t.pricing.title, description: t.pricing.subtitle });
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const [packages, services] = await Promise.all([
    packagesForCountry(null),
    prisma.service.findMany({ where: { isActive: true, category: { not: "VISA" } }, orderBy: { sortOrder: "asc" }, take: 6 }),
  ]);
  return (
    <>
      <PageHero title={t.pricing.title} subtitle={t.pricing.subtitle} />
      <section className="container py-16">
        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
          {packages.map((p) => (
            <PackageCard key={p.id} p={p} locale={locale} dict={t} href={`/${locale}/apply?package=${p.slug}`} />
          ))}
        </div>
        <Alert tone="warning" className="mt-10">{t.pricing.officialFeesNote}</Alert>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="container">
          <SectionHeading title={t.home.servicesTitle} subtitle={t.home.servicesSubtitle} />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} s={s} locale={locale} dict={t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
