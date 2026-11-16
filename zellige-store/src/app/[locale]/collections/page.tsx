import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { getCollections } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/SectionHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const s = await getSettings();
  return pageMetadata({ locale, path: "/collections", title: getDict(locale).nav.collections, description: getDict(locale).meta.description, siteName: s.store.name });
}

export default async function CollectionsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const collections = await getCollections();
  return (
    <div className="container py-8 md:py-12">
      <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { label: d.nav.collections }]} />
      <h1 className="mb-10 mt-3 font-display text-4xl font-semibold md:text-5xl">{d.nav.collections}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} href={`/${locale}/collections/${c.slug}`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ivory-200">
              {c.image && <Image src={c.image} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
              {c.badge && tr(c.badge, locale) && <span className="absolute start-3 top-3 rounded-full bg-saffron px-2.5 py-1 text-[11px] font-bold uppercase">{tr(c.badge, locale)}</span>}
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">{tr(c.name, locale)}</h2>
            {c.description && <p className="mt-1 line-clamp-2 text-sm text-charcoal-600">{tr(c.description, locale)}</p>}
            <p className="mt-2 text-xs font-semibold text-majorelle">{c.count} → </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
