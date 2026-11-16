import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDict, isLocale, tr } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { renderRichText } from "@/lib/richtext";
import { Breadcrumbs } from "@/components/ui/SectionHeader";

type Props = { params: Promise<{ locale: string; slug: string }> };

const getPage = (slug: string) => prisma.page.findUnique({ where: { slug } });

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPage(slug);
  if (!page) return {};
  const s = await getSettings();
  return pageMetadata({ locale, path: `/pages/${slug}`, title: tr(page.title, locale), siteName: s.store.name });
}

export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();
  const d = getDict(locale);
  const s = await getSettings();
  const body = tr(page.body, locale)
    .replaceAll("{store}", s.store.name)
    .replaceAll("{email}", s.store.email || "—")
    .replaceAll("{phone}", s.store.phone || "—")
    .replaceAll("{address}", s.store.address || "—")
    .replaceAll("{legalName}", s.store.legalName || s.store.name)
    .replaceAll("{ice}", s.store.ice || "—");
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <Breadcrumbs items={[{ href: `/${locale}`, label: d.common.home }, { label: tr(page.title, locale) }]} />
      <h1 className="mb-8 mt-3 font-display text-4xl font-semibold md:text-5xl">{tr(page.title, locale)}</h1>
      <div className="prose-store">{renderRichText(body)}</div>
      <p className="mt-10 text-xs text-charcoal-400">{page.updatedAt.toLocaleDateString(locale === "ar" ? "ar-MA" : locale, { dateStyle: "long" })}</p>
    </div>
  );
}
