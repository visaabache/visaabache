import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/db";
import { destinationPhotos } from "@/lib/destination-photos";
import { PageHero } from "@/components/site/cards";
import { DestinationPhoto } from "@/components/site/destination-photo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/credits", title: t.credits.title, description: t.credits.intro.slice(0, 160) });
}

/** Attribution for every third-party photo used on the site (required by CC BY / CC BY-SA). */
export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const countries = await prisma.country.findMany({ select: { slug: true, name: true }, orderBy: { sortOrder: "asc" } });
  const nameOf = (slug: string) => tr(countries.find((c) => c.slug === slug)?.name, locale) || slug;
  const entries = Object.entries(destinationPhotos);
  return (
    <>
      <PageHero title={t.credits.title} subtitle={t.credits.intro} />
      <section className="container py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([slug, p]) => (
            <li key={slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <DestinationPhoto slug={slug} alt={nameOf(slug)} className="aspect-[16/9] w-full" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              <div className="space-y-1 p-4 text-sm">
                <p className="font-semibold text-navy-800">{nameOf(slug)}</p>
                <p className="text-slate-600">{t.credits.photo} {t.credits.by} {p.author || "—"}</p>
                <p className="text-slate-600">
                  {t.credits.license}:{" "}
                  {p.licenseUrl ? <a className="text-navy-700 underline" href={p.licenseUrl} target="_blank" rel="noopener noreferrer license">{p.license}</a> : p.license}
                </p>
                <p className="text-slate-600">
                  {t.credits.source}: <a className="text-navy-700 underline" href={p.page} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
