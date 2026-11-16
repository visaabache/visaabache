import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { findCategory, getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";
import { ShopListing, type SearchParams } from "@/components/shop/ShopListing";
import { Breadcrumbs } from "@/components/ui/SectionHeader";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const cat = findCategory(await getCategoryTree(), slug);
  if (!cat) return {};
  const s = await getSettings();
  const sp = await searchParams;
  return pageMetadata({
    locale,
    path: `/category/${slug}`,
    title: tr(cat.name, locale),
    description: tr(cat.description, locale) || getDict(locale).meta.description,
    image: cat.image,
    siteName: s.store.name,
    noindex: Object.keys(sp).some((k) => k !== "page"),
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const tree = await getCategoryTree();
  const cat = findCategory(tree, slug);
  if (!cat) notFound();
  const parent = cat.parentId ? tree.flatMap((r) => [r, ...r.children]).find((c) => c.id === cat.parentId) : null;
  const d = getDict(locale);
  const crumbs = [{ href: `/${locale}`, label: d.common.home }, { href: `/${locale}/shop`, label: d.nav.shop }, ...(parent ? [{ href: `/${locale}/category/${parent.slug}`, label: tr(parent.name, locale) }] : []), { label: tr(cat.name, locale) }];
  return (
    <div className="container py-8 md:py-12">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: c.href ? `${siteUrl()}${c.href}` : undefined })) }} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">{tr(cat.name, locale)}</h1>
      {cat.description && <p className="mt-3 max-w-2xl text-charcoal-600">{tr(cat.description, locale)}</p>}
      {cat.children.length > 0 && (
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
          {cat.children.filter((c) => c.count > 0).map((c) => (
            <Link key={c.id} href={`/${locale}/category/${c.slug}`} className="chip shrink-0 bg-white">{tr(c.name, locale)} <span className="text-charcoal-400">{c.count}</span></Link>
          ))}
        </div>
      )}
      <div className="mt-8">
        <ShopListing locale={locale} d={d} sp={await searchParams} basePath={`/${locale}/category/${slug}`} category={slug} />
      </div>
    </div>
  );
}
