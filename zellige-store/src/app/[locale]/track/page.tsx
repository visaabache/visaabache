import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { TrackForm } from "@/components/account/TrackForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const s = await getSettings();
  return pageMetadata({ locale, path: "/track", title: getDict(locale).order.trackTitle, siteName: s.store.name });
}

export default async function TrackPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <div className="container max-w-lg py-14 md:py-20">
      <h1 className="font-display text-4xl font-semibold">{d.order.trackTitle}</h1>
      <p className="mt-3 text-charcoal-600">{d.order.trackText}</p>
      <TrackForm />
    </div>
  );
}
