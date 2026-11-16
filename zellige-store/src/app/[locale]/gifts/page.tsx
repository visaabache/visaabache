import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { getCollections, getProductList } from "@/lib/catalog";
import { getDisplayCurrency } from "@/lib/currency";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ProductGrid } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui/SectionHeader";
import { ZelligePattern } from "@/components/ui/Zellige";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  const s = await getSettings();
  return pageMetadata({ locale, path: "/gifts", title: d.home.giftTitle, description: d.home.giftText, image: "/catalog/star-cup-giftbox.jpg", siteName: s.store.name });
}

export default async function GiftsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const [currency, products, collections] = await Promise.all([getDisplayCurrency(), getProductList("gifts", 48), getCollections({ gift: true })]);
  return (
    <>
      <section className="relative overflow-hidden bg-terracotta-50">
        <ZelligePattern color="#B4502F" opacity={0.07} />
        <div className="container relative grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { label: d.nav.gifts }]} />
            <h1 className="mt-4 font-display text-4xl font-semibold md:text-6xl">{d.home.giftTitle}</h1>
            <p className="mt-4 max-w-md text-lg text-charcoal-600">{d.home.giftText}</p>
            {collections.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {collections.map((c) => (
                  <Link key={c.id} href={`/${locale}/collections/${c.slug}`} className="chip bg-white">{tr(c.name, locale)}</Link>
                ))}
              </div>
            )}
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[2rem]">
            <Image src="/catalog/star-cup-giftbox.jpg" alt="" fill priority sizes="(min-width:768px) 40vw, 90vw" className="object-cover" />
          </div>
        </div>
      </section>
      <section className="container py-12 md:py-16">
        <ProductGrid products={products} locale={locale} d={d} currency={currency} />
      </section>
    </>
  );
}
