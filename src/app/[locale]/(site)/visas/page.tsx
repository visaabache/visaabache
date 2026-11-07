import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { activeCountries } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/cards";
import { VisaDirectory } from "@/components/site/visa-directory";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/visas", title: t.visas.title, description: t.visas.subtitle });
}

export default async function VisasPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const locale = asLocale((await params).locale);
  const { q } = await searchParams;
  const t = getDictionary(locale);
  const countries = await activeCountries();
  return (
    <>
      <PageHero title={t.visas.title} subtitle={t.visas.subtitle} />
      <section className="container py-14">
        <VisaDirectory
          locale={locale}
          initialQuery={q || ""}
          placeholder={t.visas.filterPlaceholder}
          regions={t.regions}
          schengenLabel={t.visas.schengen}
          emptyLabel={t.visas.notFound}
          countries={countries.map((c) => ({ slug: c.slug, iso: c.isoCode, name: tr(c.name, locale), region: c.region, schengen: c.isSchengen }))}
        />
      </section>
    </>
  );
}
