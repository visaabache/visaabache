import { notFound } from "next/navigation";
import { BadgeCheck, Gift, PenLine, Sparkles, Truck } from "lucide-react";
import { getDict, isLocale, tr, fmt, type I18nText, type Locale } from "@/lib/i18n";
import { getApprovedReviews, getProduct, getRelated } from "@/lib/catalog";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDisplayCurrency } from "@/lib/currency";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { pageMetadata, JsonLd, absolute } from "@/lib/seo";
import { renderRichText } from "@/lib/richtext";
import { siteUrl } from "@/lib/utils";
import { Gallery } from "@/components/product/Gallery";
import { AddToCart } from "@/components/product/AddToCart";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs, SectionHeader } from "@/components/ui/SectionHeader";
import { Stars } from "@/components/ui/Stars";
import { SWATCHES } from "@/components/shop/Filters";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> };

async function load(slug: string, preview: boolean) {
  if (preview) {
    const user = await getCurrentUser();
    if (user && isStaff(user.role)) return getProduct(slug, { allowUnpublished: true });
  }
  return getProduct(slug);
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await load(slug, !!(await searchParams).preview);
  if (!p) return {};
  const s = await getSettings();
  return pageMetadata({
    locale,
    path: `/product/${slug}`,
    title: tr(p.seoTitle, locale) || tr(p.name, locale),
    description: tr(p.seoDescription, locale) || tr(p.shortDescription, locale) || getDict(locale).meta.description,
    image: p.images[0]?.url,
    siteName: s.store.name,
    noindex: p.status !== "PUBLISHED",
  });
}

const num = (n: number | null | undefined, unit: string, locale: Locale) => (n ? `${n.toLocaleString(locale === "ar" ? "ar-MA" : locale, { numberingSystem: "latn" })} ${unit}` : null);

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await load(slug, !!(await searchParams).preview);
  if (!p) notFound();
  const d = getDict(locale);
  const [currency, reviews, related, settings] = await Promise.all([getDisplayCurrency(), getApprovedReviews(p.id), getRelated(p.id, p.categoryId), getSettings()]);
  const name = tr(p.name, locale);
  const variants = p.variants.map((v) => ({ id: v.id, name: v.name as I18nText, price: v.price, stock: v.stock, color: v.color, pattern: v.pattern, size: v.size }));
  const totalStock = variants.length ? variants.reduce((s, v) => s + Math.max(0, v.stock), 0) : p.stock;
  const prices = variants.length ? variants.map((v) => v.price ?? p.price) : [p.price];
  const cityDays = await prisma.shippingCity.aggregate({ where: { isActive: true }, _min: { minDays: true }, _max: { maxDays: true } });

  const specs = [
    [d.product.width, num(p.widthCm, d.common.cm, locale)],
    [d.product.height, num(p.heightCm, d.common.cm, locale)],
    [d.product.depth, num(p.depthCm, d.common.cm, locale)],
    [d.product.diameter, num(p.diameterCm, d.common.cm, locale)],
    [d.product.capacity, num(p.capacityMl, d.common.ml, locale)],
    [d.product.weight, num(p.weightG, d.common.g, locale)],
  ].filter((s): s is [string, string] => !!s[1]);
  const craftVerified = p.craftType === "ARTISAN_MADE" || p.craftType === "HANDMADE_VERIFIED";
  const crumbs = [
    { href: `/${locale}`, label: d.common.home },
    { href: `/${locale}/shop`, label: d.nav.shop },
    ...(p.category ? [{ href: `/${locale}/category/${p.category.slug}`, label: tr(p.category.name, locale) }] : []),
    { label: name },
  ];
  const url = `${siteUrl()}/${locale}/product/${p.slug}`;
  const availability = (stock: number) => (stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          sku: p.sku,
          description: tr(p.shortDescription, locale) || tr(p.description, locale) || undefined,
          image: p.images.map((i) => absolute(i.url)),
          url,
          brand: { "@type": "Brand", name: settings.store.name },
          category: p.category ? tr(p.category.name, locale) : undefined,
          material: tr(p.materials, locale) || undefined,
          color: p.colors.join(", ") || undefined,
          weight: p.weightG ? { "@type": "QuantitativeValue", value: p.weightG, unitCode: "GRM" } : undefined,
          offers:
            variants.length > 1
              ? { "@type": "AggregateOffer", priceCurrency: "MAD", lowPrice: Math.min(...prices) / 100, highPrice: Math.max(...prices) / 100, offerCount: variants.length, availability: availability(totalStock) }
              : { "@type": "Offer", priceCurrency: "MAD", price: (prices[0] / 100).toFixed(2), availability: availability(totalStock), url, itemCondition: "https://schema.org/NewCondition" },
          aggregateRating: p.ratingCount > 0 ? { "@type": "AggregateRating", ratingValue: p.ratingAvg.toFixed(1), reviewCount: p.ratingCount } : undefined,
          review: reviews.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewRating: { "@type": "Rating", ratingValue: r.rating }, reviewBody: r.body })),
        }}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: c.href ? `${siteUrl()}${c.href}` : url })) }} />

      {p.status !== "PUBLISHED" && <div className="bg-saffron py-2 text-center text-sm font-semibold">{d.product.previewBanner}</div>}

      <div className="container py-6 md:py-10">
        <Breadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <Gallery images={p.images.map((i) => ({ url: i.url, alt: tr(i.alt, locale), width: i.width, height: i.height }))} name={name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            {p.category && <p className="eyebrow">{tr(p.category.name, locale)}</p>}
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight md:text-5xl">{name}</h1>
            {p.ratingCount > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-charcoal-600">
                <Stars value={p.ratingAvg} />
                {fmt(d.product.reviewsCount, { n: p.ratingCount })}
              </a>
            )}
            {p.shortDescription && <p className="mt-4 text-charcoal-600">{tr(p.shortDescription, locale)}</p>}

            <div className="mt-6">
              <AddToCart product={{ id: p.id, slug: p.slug, name: p.name as I18nText, price: p.price, compareAtPrice: p.compareAtPrice, stock: p.stock, image: p.images[0]?.url ?? null, variants }} />
            </div>

            <ul className="mt-8 space-y-3 border-t border-charcoal/10 pt-6 text-sm text-charcoal-600">
              <li className="flex gap-3">
                <Truck className="h-5 w-5 shrink-0 text-majorelle" />
                {fmt(d.product.deliveryNote, { min: cityDays._min.minDays ?? 1, max: cityDays._max.maxDays ?? 5 })}
              </li>
              <li className="flex gap-3">
                {craftVerified ? <BadgeCheck className="h-5 w-5 shrink-0 text-emerald" /> : <Sparkles className="h-5 w-5 shrink-0 text-saffron-700" />}
                <span>
                  <strong className="font-semibold text-charcoal">{d.product.craftTypes[p.craftType]}.</strong> {d.product.craftExplain[p.craftType]}
                </span>
              </li>
              {p.giftable && <li className="flex gap-3"><Gift className="h-5 w-5 shrink-0 text-terracotta" />{d.product.giftReady}</li>}
              {p.personalizable && <li className="flex gap-3"><PenLine className="h-5 w-5 shrink-0 text-majorelle" />{d.product.personalizable}</li>}
            </ul>

            <div className="mt-6 divide-y divide-charcoal/10 border-y border-charcoal/10">
              {p.description && tr(p.description, locale) && (
                <details className="group py-4" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{d.product.description}<span className="transition group-open:rotate-45">+</span></summary>
                  <div className="prose-store mt-3">{renderRichText(tr(p.description, locale))}</div>
                </details>
              )}
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{d.product.specifications}<span className="transition group-open:rotate-45">+</span></summary>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {specs.map(([k, v]) => (
                    <div key={k} className="contents"><dt className="text-charcoal-500">{k}</dt><dd>{v}</dd></div>
                  ))}
                  {p.colors.length > 0 && (
                    <div className="contents">
                      <dt className="text-charcoal-500">{d.product.colours}</dt>
                      <dd className="flex flex-wrap gap-2">
                        {p.colors.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-charcoal/20" style={{ background: SWATCHES[c] || "#ccc" }} />{(d.colors as Record<string, string>)[c] || c}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {p.patterns.length > 0 && <div className="contents"><dt className="text-charcoal-500">{d.product.patterns}</dt><dd>{p.patterns.map((x) => (d.patterns as Record<string, string>)[x] || x).join(", ")}</dd></div>}
                  <div className="contents"><dt className="text-charcoal-500">{d.product.sku}</dt><dd className="font-mono text-xs" dir="ltr">{p.sku}</dd></div>
                </dl>
              </details>
              {(tr(p.materials, locale) || tr(p.care, locale)) && (
                <details className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{d.product.materials}<span className="transition group-open:rotate-45">+</span></summary>
                  <div className="prose-store mt-3">
                    {tr(p.materials, locale) && renderRichText(tr(p.materials, locale))}
                    {tr(p.care, locale) && (<><h3>{d.product.care}</h3>{renderRichText(tr(p.care, locale))}</>)}
                  </div>
                </details>
              )}
              {craftVerified && tr(p.craftNote, locale) && (
                <details className="group py-4" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{d.product.craft}<span className="transition group-open:rotate-45">+</span></summary>
                  <div className="prose-store mt-3">{renderRichText(tr(p.craftNote, locale))}</div>
                </details>
              )}
            </div>
          </div>
        </div>

        <section id="reviews" className="mt-20 scroll-mt-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="section-title">{d.product.reviews}</h2>
              {p.ratingCount > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-display text-5xl font-semibold">{p.ratingAvg.toFixed(1)}</span>
                  <div><Stars value={p.ratingAvg} size={18} /><p className="mt-1 text-sm text-charcoal-500">{fmt(d.product.reviewsCount, { n: p.ratingCount })}</p></div>
                </div>
              )}
              <div className="mt-6"><ReviewForm productId={p.id} /></div>
            </div>
            <div>
              {reviews.length === 0 ? (
                <p className="text-charcoal-600">{d.product.noReviews}</p>
              ) : (
                <ul className="divide-y divide-charcoal/10">
                  {reviews.map((r) => (
                    <li key={r.id} className="py-6 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Stars value={r.rating} />
                        <span className="text-sm font-semibold">{r.name}</span>
                        {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-xs text-emerald"><BadgeCheck className="h-3.5 w-3.5" />{d.product.verifiedPurchase}</span>}
                        <span className="text-xs text-charcoal-400">{r.createdAt.toLocaleDateString(locale === "ar" ? "ar-MA" : locale)}</span>
                      </div>
                      {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                      <p className="mt-1 whitespace-pre-line text-charcoal-600">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionHeader title={d.product.related} />
            <ProductGrid products={related} locale={locale} d={d} currency={currency} />
          </section>
        )}
      </div>
    </>
  );
}
