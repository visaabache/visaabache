import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/SectionHeader";
import { StarMark, ZelligeDivider, ZelligePattern } from "@/components/ui/Zellige";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  const s = await getSettings();
  return pageMetadata({ locale, path: "/craftsmanship", title: d.craft.title, description: d.craft.lead, image: "/catalog/medallion-plate.jpg", siteName: s.store.name });
}

export default async function CraftPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const palette = [
    { c: "#1E3F8A", n: { en: "Fez blue", fr: "Bleu de Fès", ar: "أزرق فاس" } },
    { c: "#1E6B57", n: { en: "Emerald", fr: "Émeraude", ar: "زمردي" } },
    { c: "#D6A23A", n: { en: "Saffron", fr: "Safran", ar: "زعفراني" } },
    { c: "#B4502F", n: { en: "Terracotta", fr: "Terre cuite", ar: "طيني" } },
    { c: "#FAF6EE", n: { en: "Ivory", fr: "Ivoire", ar: "عاجي" } },
    { c: "#23211F", n: { en: "Charcoal", fr: "Anthracite", ar: "فحمي" } },
  ];
  return (
    <article>
      <header className="relative overflow-hidden bg-majorelle-800 text-ivory">
        <ZelligePattern color="#FAF6EE" opacity={0.07} />
        <div className="container relative py-16 md:py-24">
          <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { label: d.nav.craft }]} />
          <p className="eyebrow mt-8 !text-saffron">{d.craft.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-semibold leading-tight md:text-7xl">{d.craft.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/85">{d.craft.lead}</p>
        </div>
      </header>
      <div className="container grid gap-12 py-16 md:grid-cols-[1fr_1.1fr] md:py-24">
        <div className="space-y-6 text-lg leading-8 text-charcoal-600">
          <p>{d.craft.p1}</p>
          <p>{d.craft.p2}</p>
          <ZelligeDivider className="!justify-start" />
          <p className="font-medium text-charcoal">{d.craft.p3}</p>
          <Link href={`/${locale}/shop`} className="btn-primary">{d.home.shopNow}</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl"><Image src="/catalog/medallion-plate.jpg" alt="" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" /></div>
          <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-2xl"><Image src="/catalog/serving-paddle.jpg" alt="" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" /></div>
        </div>
      </div>
      <section className="border-y border-charcoal/10 bg-white">
        <div className="container py-14">
          <div className="grid gap-8 md:grid-cols-3">
            {(["geometry", "colour", "honesty"] as const).map((k) => (
              <div key={k}>
                <StarMark className="h-8 w-8" />
                <h2 className="mt-3 font-display text-2xl font-semibold">{d.craft.pillars[k]}</h2>
                <p className="mt-2 text-charcoal-600">{d.craft.pillars[`${k}Text` as const]}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {palette.map((p) => (
              <div key={p.c} className="text-center">
                <div className="aspect-square rounded-2xl border border-charcoal/10" style={{ background: p.c }} />
                <p className="mt-2 text-xs font-medium text-charcoal-600">{p.n[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
