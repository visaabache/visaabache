import { ArrowRight, BookOpenCheck, FileCheck, MessageCircle, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toWhatsAppNumber } from "@/lib/utils";
import Link from "@/components/ui/link";
import { Card, Flag } from "@/components/ui/misc";
import { PageHero } from "@/components/site/cards";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";

/** "Apply for assistance" when online forms are off: the steps, a WhatsApp button and links to the destination pages. */
export async function ApplyInfo({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [countries, packages, settings] = await Promise.all([
    prisma.country.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, isoCode: true } }),
    prisma.package.findMany({ where: { isActive: true }, select: { slug: true, name: true } }),
    getSettings(),
  ]);
  const i = t.info;
  const number = settings.whatsapp.enabled ? toWhatsAppNumber(settings.whatsapp.number) : "";
  const steps = [
    { icon: BookOpenCheck, title: i.s1t, text: i.s1x },
    { icon: MessageCircle, title: i.s2t, text: i.s2x },
    { icon: FileCheck, title: i.s3t, text: i.s3x },
    { icon: UserRoundCheck, title: i.s4t, text: i.s4x },
  ];
  return (
    <>
      <PageHero title={i.applyTitle} subtitle={i.applySubtitle}>
        <WhatsAppCta
          className="mt-8"
          number={number}
          message={i.waMessageGeneric}
          label={i.waCta}
          hint={i.waHint}
          fromQuery={{
            countries: Object.fromEntries(countries.map((c) => [c.slug, tr(c.name, locale)])),
            packages: Object.fromEntries(packages.map((p) => [p.slug, tr(p.name, locale)])),
            country: i.waMessage,
            pkg: i.waMessagePackage,
          }}
        />
      </PageHero>

      <section className="container py-14">
        <p className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /> {i.privacyNote}
        </p>

        <h2 className="mt-14 text-center font-display text-3xl font-semibold text-navy-800">{i.stepsTitle}</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, n) => (
            <li key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 text-gold-400 shadow-[0_10px_24px_-8px_rgba(16,39,71,.55)]">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="absolute end-5 top-4 font-display text-4xl font-semibold text-sand-300">{n + 1}</span>
              <h3 className="mt-5 font-semibold text-navy-800">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 font-display text-2xl font-semibold text-navy-800">{i.chooseDestination}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {countries.filter((c) => c.isoCode !== "EU").map((c) => (
            <li key={c.slug}>
              <Link href={`/${locale}/visas/${c.slug}`} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 shadow-sm transition hover:border-gold-300 hover:shadow-soft">
                <Flag code={c.isoCode} className="h-5 w-7 rounded-[3px]" />
                <span className="flex-1 truncate">{tr(c.name, locale)}</span>
                <ArrowRight className="rtl-flip h-4 w-4 text-slate-400 transition group-hover:text-gold-600" />
              </Link>
            </li>
          ))}
        </ul>

        <Card className="mt-14 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{t.common.independentNotice}</p>
          <Link href={`/${locale}/pricing`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-gold-700 hover:text-gold-800">
            {i.seePricing} <ArrowRight className="rtl-flip h-4 w-4" />
          </Link>
        </Card>
      </section>
    </>
  );
}
