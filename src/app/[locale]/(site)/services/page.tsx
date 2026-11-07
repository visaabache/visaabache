import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, ServiceCard } from "@/components/site/cards";
import { SectionHeading, Alert } from "@/components/ui/misc";

const CATS = ["VISA", "ADMINISTRATIVE", "TRAVEL", "STUDY"] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/services", title: t.services.title, description: t.services.subtitle });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHero title={t.services.title} subtitle={t.services.subtitle}>
        <nav className="mt-8 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <a key={c} href={`#${c.toLowerCase()}`} className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium hover:bg-white/20">
              {t.services.categories[c]}
            </a>
          ))}
        </nav>
      </PageHero>
      <div className="container space-y-20 py-16">
        {CATS.map((cat) => {
          const list = services.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <section key={cat} id={cat.toLowerCase()} className="scroll-mt-24">
              <SectionHeading title={t.services.categories[cat]} subtitle={t.services.categoryIntro[cat]} />
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <ServiceCard key={s.id} s={s} locale={locale} dict={t} />
                ))}
              </div>
            </section>
          );
        })}
        <Alert tone="info">{t.services.disclaimerDefault}</Alert>
      </div>
    </>
  );
}
