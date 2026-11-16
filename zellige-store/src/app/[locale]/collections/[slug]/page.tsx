import { notFound } from "next/navigation";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { getCollection } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ShopListing, type SearchParams } from "@/components/shop/ShopListing";
import { Breadcrumbs } from "@/components/ui/SectionHeader";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = await getCollection(slug);
  if (!c) return {};
  const s = await getSettings();
  return pageMetadata({ locale, path: `/collections/${slug}`, title: tr(c.name, locale), description: tr(c.description, locale), image: c.image, siteName: s.store.name });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getCollection(slug);
  if (!c) notFound();
  const d = getDict(locale);
  return (
    <div className="container py-8 md:py-12">
      <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { href: `/${locale}/collections`, label: d.nav.collections }, { label: tr(c.name, locale) }]} />
      {c.badge && tr(c.badge, locale) && <p className="eyebrow mt-4">{tr(c.badge, locale)}</p>}
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{tr(c.name, locale)}</h1>
      {c.description && <p className="mt-3 max-w-2xl text-charcoal-600">{tr(c.description, locale)}</p>}
      <div className="mt-8">
        <ShopListing locale={locale} d={d} sp={await searchParams} basePath={`/${locale}/collections/${slug}`} collection={slug} />
      </div>
    </div>
  );
}
