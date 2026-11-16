import { notFound } from "next/navigation";
import { getDict, isLocale, fmt } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ShopListing, type SearchParams } from "@/components/shop/ShopListing";
import { Breadcrumbs } from "@/components/ui/SectionHeader";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  const sp = await searchParams;
  const s = await getSettings();
  // Filtered and searched variants are not indexed; the canonical stays /shop.
  const filtered = Object.keys(sp).some((k) => k !== "page");
  return pageMetadata({ locale, path: "/shop", title: d.shop.title, description: d.meta.description, siteName: s.store.name, noindex: filtered });
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  return (
    <div className="container py-8 md:py-12">
      <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { label: d.shop.title }]} />
      <h1 className="mb-8 mt-3 font-display text-4xl font-semibold md:text-5xl">{q ? fmt(d.shop.searchFor, { q }) : d.shop.title}</h1>
      <ShopListing locale={locale} d={d} sp={sp} basePath={`/${locale}/shop`} />
    </div>
  );
}
