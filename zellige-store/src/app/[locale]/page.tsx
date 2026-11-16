import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Gift, Globe2, Truck } from "lucide-react";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { getCategoryTree, getCollections, getGalleryImages, getProductList, getTestimonials } from "@/lib/catalog";
import { getDisplayCurrency } from "@/lib/currency";
import { getSettings } from "@/lib/settings";
import { pageMetadata, JsonLd, absolute } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";
import { ProductGrid, ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StarMark, ZelligeDivider, ZelligePattern } from "@/components/ui/Zellige";
import { Stars } from "@/components/ui/Stars";

const HERO = "/catalog/twin-mug-sets-display.jpg";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  const s = await getSettings();
  return pageMetadata({ locale, path: "/", title: `${s.store.name}: ${d.meta.title}`, description: d.meta.description, image: HERO, siteName: s.store.name });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const h = (p: string) => `/${locale}${p}`;
  const [currency, tree, featuredCollections, giftCollections, bestsellers, newest, gifts, gallery, testimonials, settings] = await Promise.all([
    getDisplayCurrency(),
    getCategoryTree(),
    getCollections({ featured: true }),
    getCollections({ gift: true }),
    getProductList("bestsellers", 8),
    getProductList("new", 4),
    getProductList("gifts", 4),
    getGalleryImages(8),
    getTestimonials(),
    getSettings(),
  ]);
  const categories = tree.filter((c) => c.count > 0);
  const perks = [
    { icon: Truck, title: d.home.perks.delivery, text: d.home.perks.deliveryText },
    { icon: Banknote, title: d.home.perks.cod, text: d.home.perks.codText },
    { icon: Gift, title: d.home.perks.gift, text: d.home.perks.giftText },
    { icon: Globe2, title: d.home.perks.world, text: d.home.perks.worldText },
  ];
  const socialUrl = settings.store.instagram || settings.store.facebook || settings.store.tiktok || settings.store.pinterest;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: settings.store.name,
          url: `${siteUrl()}/${locale}`,
          image: absolute(HERO),
          logo: absolute("/icon.svg"),
          address: settings.store.address ? { "@type": "PostalAddress", streetAddress: settings.store.address, addressCountry: "MA" } : undefined,
          telephone: settings.store.phone || undefined,
          email: settings.store.email || undefined,
          currenciesAccepted: "MAD",
          paymentAccepted: "Cash, Credit Card, Bank Transfer",
          sameAs: [settings.store.instagram, settings.store.facebook, settings.store.tiktok, settings.store.pinterest].filter(Boolean),
        }}
      />

      {/* 1-4. Hero */}
      <section className="relative isolate overflow-hidden bg-charcoal">
        <Image src={HERO} alt={tr({ en: "Zellige mug gift sets", fr: "Coffrets de mugs zellige", ar: "علب أكواب بزخارف الزليج" }, locale)} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/85 via-charcoal/45 to-charcoal/10 md:bg-gradient-to-r rtl:md:bg-gradient-to-l md:from-charcoal/85 md:via-charcoal/50 md:to-transparent" />
        <div className="container flex min-h-[78svh] items-end pb-14 pt-32 md:min-h-[82vh] md:items-center md:pb-20">
          <div className="max-w-xl animate-fade-up text-ivory">
            <p className="eyebrow !text-saffron">{d.home.heroEyebrow}</p>
            <h1 className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">{d.home.heroTitle}</h1>
            <p className="mt-5 max-w-md text-lg text-ivory/85">{d.home.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={h("/shop")} className="btn-light">
                {d.home.shopNow}
                <ArrowRight className="rtl-flip h-4 w-4" />
              </Link>
              <Link href={h("/collections")} className="btn-ghost-light">
                {d.home.exploreCollections}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-majorelle-50 text-majorelle">
                <p.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-0.5 text-xs text-charcoal-500">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Shop by category */}
      {categories.length > 0 && (
        <section className="container py-16 md:py-24">
          <SectionHeader eyebrow={d.nav.shop} title={d.home.shopByCategory} href={h("/shop")} linkLabel={d.home.viewAll} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {categories.map((c) => (
              <Link key={c.id} href={h(`/category/${c.slug}`)} className="group relative w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[45%] md:w-auto">
                <div className="relative aspect-[4/5] bg-ivory-200">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width:768px) 25vw, 70vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                  <h3 className="font-display text-2xl font-semibold">{tr(c.name, locale)}</h3>
                  <p className="mt-1 text-xs text-ivory/75">{c.count} · {d.home.viewAll} →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Featured collections */}
      {featuredCollections.length > 0 && (
        <section className="bg-ivory-200/60 py-16 md:py-24">
          <div className="container">
            <SectionHeader eyebrow={d.nav.collections} title={d.home.featuredCollections} href={h("/collections")} linkLabel={d.home.viewAll} />
            <div className="grid gap-5 md:grid-cols-3">
              {featuredCollections.slice(0, 3).map((c, i) => (
                <Link key={c.id} href={h(`/collections/${c.slug}`)} className={`group relative overflow-hidden rounded-2xl bg-charcoal ${i === 0 ? "md:row-span-2" : ""}`}>
                  <div className={`relative ${i === 0 ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[16/10]"}`}>
                    {c.image && <Image src={c.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover opacity-90 transition duration-700 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                    {c.badge && tr(c.badge, locale) && <span className="mb-2 inline-block rounded-full bg-saffron px-2.5 py-1 text-[11px] font-bold uppercase text-charcoal">{tr(c.badge, locale)}</span>}
                    <h3 className="font-display text-2xl font-semibold md:text-3xl">{tr(c.name, locale)}</h3>
                    {c.description && <p className="mt-1 line-clamp-2 max-w-sm text-sm text-ivory/80">{tr(c.description, locale)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="container py-16 md:py-24">
          <SectionHeader eyebrow={d.home.bestsellers} title={d.home.bestsellers} href={h("/shop?sort=bestselling")} linkLabel={d.home.viewAll} />
          <ProductGrid products={bestsellers} locale={locale} d={d} currency={currency} />
        </section>
      )}

      {/* 9. Craftsmanship story */}
      <section className="relative overflow-hidden bg-majorelle-800 text-ivory">
        <ZelligePattern color="#FAF6EE" opacity={0.06} />
        <div className="container relative grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem]">
              <Image src="/catalog/medallion-plate.jpg" alt={tr({ en: "Zellige medallion plate", fr: "Assiette médaillon zellige", ar: "صحن بزخرفة الزليج" }, locale)} fill sizes="(min-width:768px) 40vw, 90vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -end-4 hidden h-36 w-28 overflow-hidden rounded-2xl border-4 border-majorelle-800 sm:block">
              <Image src="/catalog/serving-paddle.jpg" alt="" fill sizes="120px" className="object-cover" />
            </div>
          </div>
          <div>
            <p className="eyebrow !text-saffron">{d.craft.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{d.craft.title}</h2>
            <p className="mt-5 text-lg leading-8 text-ivory/85">{d.craft.lead}</p>
            <p className="mt-4 leading-7 text-ivory/70">{d.craft.p1}</p>
            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              {(["geometry", "colour", "honesty"] as const).map((k) => (
                <div key={k} className="border-t border-white/15 pt-4">
                  <dt className="flex items-center gap-2 font-semibold">
                    <StarMark className="h-5 w-5" />
                    {d.craft.pillars[k]}
                  </dt>
                  <dd className="mt-1.5 text-sm text-ivory/70">{d.craft.pillars[`${k}Text` as const]}</dd>
                </div>
              ))}
            </dl>
            <Link href={h("/craftsmanship")} className="btn-ghost-light mt-8">
              {d.craft.readMore}
              <ArrowRight className="rtl-flip h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. New arrivals */}
      {newest.length > 0 && (
        <section className="container py-16 md:py-24">
          <SectionHeader eyebrow={d.product.new} title={d.home.newArrivals} href={h("/shop?sort=newest")} linkLabel={d.home.viewAll} />
          <ProductGrid products={newest} locale={locale} d={d} currency={currency} />
        </section>
      )}

      {/* 10. Gift collections */}
      {(gifts.length > 0 || giftCollections.length > 0) && (
        <section className="container">
          <div className="relative overflow-hidden rounded-[2rem] bg-terracotta-50 px-5 py-12 md:px-12 md:py-16">
            <ZelligePattern color="#B4502F" opacity={0.07} />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
              <div>
                <Gift className="h-8 w-8 text-terracotta" />
                <h2 className="mt-4 section-title">{d.home.giftTitle}</h2>
                <p className="mt-3 text-charcoal-600">{d.home.giftText}</p>
                {giftCollections.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {giftCollections.map((c) => (
                      <Link key={c.id} href={h(`/collections/${c.slug}`)} className="chip bg-white">
                        {tr(c.name, locale)}
                      </Link>
                    ))}
                  </div>
                )}
                <Link href={h("/gifts")} className="btn-accent mt-7">
                  {d.home.giftCta}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {gifts.map((p) => (
                  <ProductCard key={p.id} p={p} locale={locale} d={d} currency={currency} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 11. Testimonials: only real, published ones from the admin */}
      {testimonials.length > 0 && (
        <section className="container py-16 md:py-24">
          <SectionHeader title={d.home.testimonials} center />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <figure key={t.id} className="card p-7">
                <Stars value={t.rating} />
                <blockquote className="mt-4 font-display text-xl leading-snug">“{tr(t.quote, locale)}”</blockquote>
                <figcaption className="mt-5 text-sm text-charcoal-500">
                  <span className="font-semibold text-charcoal">{t.name}</span>
                  {t.city ? ` · ${t.city}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 12. Instagram-style gallery */}
      {gallery.length > 0 && (
        <section className="container pt-16 md:pt-24">
          <div className="mb-8 text-center">
            <ZelligeDivider className="mb-4" />
            <h2 className="section-title">{d.home.galleryTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-charcoal-600">{d.home.galleryText}</p>
            {socialUrl && (
              <a href={socialUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-majorelle">
                {d.home.followUs} →
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
            {gallery.map((g, i) => (
              <Link key={g.url + i} href={h(`/product/${g.slug}`)} className="group relative aspect-square overflow-hidden rounded-xl bg-ivory-200">
                <Image src={g.url} alt={tr(g.name, locale)} fill sizes="(min-width:640px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-charcoal/0 transition group-hover:bg-charcoal/20" />
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* 13-14. Newsletter and footer are rendered by the layout. */}
    </>
  );
}
