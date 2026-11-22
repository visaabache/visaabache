import Link from "@/components/ui/link";
import { ArrowRight, BadgeCheck, FileCheck, HeartHandshake, Lock, MapPinned, ScrollText, UserRoundCheck, Wallet, Plane } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { activeCountries, publishedTestimonials } from "@/lib/queries";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { appUrl, whatsappLink } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Flag, SectionHeading, Card } from "@/components/ui/misc";
import { DestinationPhoto } from "@/components/site/destination-photo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { FaqList, ServiceCard, ServicePhotoImg, ServicePrice, TestimonialCard } from "@/components/site/cards";
import { DestinationSearch } from "@/components/site/destination-search";
import { FlagMarquee } from "@/components/motion/marquee";
import { HeroArrow, HomeHero } from "@/components/site/home-hero";
import { CountUp } from "@/components/motion/count-up";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: asLocale((await params).locale), path: "" });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const [countries, services, faqs, testimonials, settings] = await Promise.all([
    activeCountries(),
    prisma.service.findMany({ where: { isActive: true }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] }),
    prisma.faq.findMany({ where: { scope: "GENERAL", isPublished: true, showOnHome: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    publishedTestimonials(6),
    getSettings(),
  ]);
  const popular = countries.filter((c) => c.isPopular).slice(0, 8);
  const featuredServices = [
    ...services.filter((s) => s.isFeatured),
    ...(["ADMINISTRATIVE", "TRAVEL", "STUDY"] as const).map((cat) => services.find((s) => s.category === cat && !s.isFeatured)).filter(Boolean),
  ].slice(0, 5) as typeof services;
  const l = (p: string) => `/${locale}${p}`;
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, tr(settings.whatsapp.defaultMessage, locale)) : "";
  const chips = countries.filter((c) => c.isoCode !== "EU").map((c) => ({ href: l(`/visas/${c.slug}`), label: tr(c.name, locale), iso: c.isoCode }));
  const half = Math.ceil(chips.length / 2);

  const steps = [
    { icon: MapPinned, photo: "travel-assistance", title: t.home.step1Title, text: t.home.step1Text },
    { icon: ScrollText, photo: "document-preparation", title: t.home.step2Title, text: t.home.step2Text },
    { icon: FileCheck, photo: "administrative-forms", title: t.home.step3Title, text: t.home.step3Text },
    { icon: UserRoundCheck, photo: "appointment-guidance", title: t.home.step4Title, text: t.home.step4Text },
  ];
  const whys = [
    { icon: Wallet, title: t.home.why1Title, text: t.home.why1Text },
    { icon: Lock, title: t.home.why2Title, text: t.home.why2Text },
    { icon: HeartHandshake, title: t.home.why3Title, text: t.home.why3Text },
    { icon: BadgeCheck, title: t.home.why4Title, text: t.home.why4Text },
  ];
  const stats = [
    { value: countries.length, suffix: "", label: t.home.statDestinations },
    { value: 3, suffix: "", label: t.home.statLanguages },
    { value: services.length, suffix: "", label: t.home.statServices },
    { value: 256, suffix: "", label: t.home.statEncryption, prefix: "AES-" },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": appUrl("/#website"),
          name: "VISA ABACHE",
          url: appUrl(`/${locale}`),
          inLanguage: locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en",
          publisher: { "@id": appUrl("/#organization") },
        }}
      />
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: tr(f.question, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.answer, locale) } })) }} />
      )}

      {/* ───────────── Hero ───────────── */}
      <HomeHero
        t={{
          welcome: t.home.heroWelcome,
          title: t.home.heroTitle,
          highlight: t.home.heroHighlight,
          subtitle: t.home.heroSubtitle,
          beach: t.home.heroCapBeach,
          family: t.home.heroCapFamily,
          green: t.home.heroCapGreen,
          city: t.home.heroCapCity,
          stamp: t.home.heroStamp,
          photosAlt: t.home.heroPhotosAlt,
        }}
        actions={
          <>
            <ButtonLink href={l("/apply")} size="lg" variant="navy">
              {t.common.applyForAssistance} <HeroArrow />
            </ButtonLink>
            <ButtonLink href={l("/services")} size="lg" variant="outline">
              {t.common.exploreServices}
            </ButtonLink>
          </>
        }
        search={
          <DestinationSearch
            items={countries.map((c) => ({ slug: c.slug, name: tr(c.name, locale), iso: c.isoCode }))}
            locale={locale}
            placeholder={t.home.searchPlaceholder}
            button={t.home.searchButton}
          />
        }
        trust={[t.home.trust1, t.home.trust2, t.home.trust3]}
      />

      {/* ───────────── Stats (overlapping the hero) ───────────── */}
      <section className="container relative z-10 -mt-14">
        <div className="reveal-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-premium">
              <p className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
                {s.prefix}
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Destinations strip ───────────── */}
      <section className="space-y-1 pt-14">
        <p className="container mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 sm:text-xs sm:tracking-[0.25em]">{t.home.marqueeTitle}</p>
        <FlagMarquee items={chips.slice(0, half)} light />
        <FlagMarquee items={chips.slice(half)} reverse light />
      </section>

      {/* ───────────── Popular destinations ───────────── */}
      <section className="container py-20 sm:py-24">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={t.nav.visas} title={t.home.popularTitle} subtitle={t.home.popularSubtitle} />
          <Link href={l("/visas")} className="group flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-gold-700">
            {t.common.seeAll} <ArrowRight className="rtl-flip h-4 w-4 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
        <div className="reveal-stagger mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {popular.map((c, i) => (
            <Link
              key={c.id}
              href={l(`/visas/${c.slug}`)}
              className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-navy-900 p-4 text-white shadow-soft ring-1 ring-black/5 transition duration-500 hover:-translate-y-1 hover:shadow-premium sm:aspect-[4/3] sm:p-5 lg:aspect-[3/4]"
            >
              <DestinationPhoto
                slug={c.slug}
                alt={tr(c.name, locale)}
                priority={i < 4}
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="absolute inset-0 -z-10 h-full w-full transition duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950/95 via-navy-950/35 to-navy-950/5" aria-hidden />
              <span className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover:bg-gold-500 group-hover:text-navy-900">
                <ArrowRight className="rtl-flip h-4 w-4 -rotate-45 transition group-hover:rotate-0" />
              </span>
              <Flag code={c.isoCode} className="mb-3 h-7 w-10 rounded shadow-md ring-1 ring-white/30 transition duration-500 group-hover:scale-110" />
              <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{tr(c.name, locale)}</p>
              <p className="mt-0.5 text-xs text-white/75">{c.isSchengen ? t.visas.schengen : t.regions[c.region]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Services (bento) ───────────── */}
      <section className="relative overflow-hidden bg-sand-50 py-20 sm:py-24">
        <div className="container relative">
          <SectionHeading eyebrow={t.nav.services} title={t.home.servicesTitle} subtitle={t.home.servicesSubtitle} center className="reveal" />
          <div className="reveal-stagger mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s, i) =>
              i === 0 ? (
                <Link key={s.id} href={l(`/services/${s.slug}`)} className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl bg-navy-900 p-7 text-white shadow-premium sm:col-span-2 lg:col-span-1 lg:row-span-2">
                  <ServicePhotoImg slug={s.slug} tall sizes="(min-width: 1024px) 400px, 100vw" className="absolute inset-0 -z-10 h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/55 via-35% to-transparent to-70%" aria-hidden />
                  <span className="absolute start-7 top-7 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-800 shadow-sm">{t.services.categories[s.category]}</span>
                  <h3 className="font-display text-3xl font-semibold leading-tight">{tr(s.name, locale)}</h3>
                  <p className="mt-3 text-white/85">{tr(s.shortDescription, locale)}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <ServicePrice s={s} locale={locale} dict={t} light />
                    <span className="flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-navy-900 transition group-hover:bg-gold-400">{t.common.learnMore} <ArrowRight className="rtl-flip h-4 w-4" /></span>
                  </div>
                </Link>
              ) : (
                <ServiceCard key={s.id} s={s} locale={locale} dict={t} />
              ),
            )}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href={l("/services")} variant="outline" size="lg">{t.common.exploreServices}</ButtonLink>
          </div>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="container py-20 sm:py-24">
        <SectionHeading eyebrow="1 · 2 · 3 · 4" title={t.home.howTitle} subtitle={t.home.howSubtitle} center className="reveal" />
        <ol className="reveal-stagger relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-premium">
              <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
                <ServicePhotoImg slug={s.photo} sizes="(min-width: 768px) 25vw, 100vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent" aria-hidden />
                <span className="absolute bottom-3 start-4 font-display text-5xl font-semibold leading-none text-white drop-shadow">{i + 1}</span>
              </div>
              <div className="relative flex-1 px-6 pb-6 pt-8">
                <span className="absolute -top-6 end-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 text-gold-400 shadow-[0_10px_24px_-8px_rgba(16,39,71,.55)] ring-4 ring-white">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-navy-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Why choose ───────────── */}
      <section className="paper relative overflow-hidden py-20 sm:py-24">
        <div className="container relative">
          <SectionHeading eyebrow="VISA ABACHE" title={t.home.whyTitle} center className="reveal" />
          <div className="reveal-stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whys.map((w) => (
              <div key={w.title} className="group relative overflow-hidden rounded-3xl border border-sand-300/70 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-premium">
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold-400 shadow-[0_10px_24px_-8px_rgba(16,39,71,.55)] ring-1 ring-gold-500/40 ring-offset-4 ring-offset-white transition duration-300 group-hover:bg-gold-500 group-hover:text-navy-900">
                  <w.icon className="h-6 w-6" strokeWidth={2.25} />
                </span>
                <h3 className="relative mt-6 text-lg font-semibold text-navy-800">{w.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{w.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-slate-500">{t.common.independentNotice}</p>
        </div>
      </section>

      {/* ───────────── Testimonials (verified only) ───────────── */}
      <section className="container py-20 sm:py-24">
        <SectionHeading title={t.home.testimonialsTitle} subtitle={t.home.testimonialsSubtitle} center className="reveal" />
        {testimonials.length ? (
          <div className="reveal-stagger mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((x) => <TestimonialCard key={x.id} t={x} locale={locale} dict={t} />)}
          </div>
        ) : (
          <Card className="reveal mx-auto mt-10 max-w-xl p-8 text-center text-sm text-slate-500">{t.home.testimonialsEmpty}</Card>
        )}
      </section>

      {/* ───────────── FAQ ───────────── */}
      {faqs.length > 0 && (
        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div className="reveal">
              <SectionHeading eyebrow={t.nav.faq} title={t.home.faqTitle} />
              <Link href={l("/faq")} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-gold-700">
                {t.common.seeAll} <ArrowRight className="rtl-flip h-4 w-4" />
              </Link>
            </div>
            <div className="reveal"><FaqList items={faqs} locale={locale} /></div>
          </div>
        </section>
      )}

      {/* ───────────── CTA + WhatsApp ───────────── */}
      <section className="container py-20 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="reveal relative overflow-hidden rounded-[2rem] bg-gold-200 p-8 text-navy-900 shadow-soft sm:p-12">
            <Plane className="absolute -end-6 -top-6 h-40 w-40 rotate-12 text-white/40" aria-hidden />
            <h2 className="relative max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">{t.home.ctaTitle}</h2>
            <p className="relative mt-3 max-w-md text-navy-800">{t.home.ctaText}</p>
            <ButtonLink href={l("/apply")} variant="navy" size="lg" className="relative mt-7">
              {t.common.applyForAssistance} <ArrowRight className="rtl-flip h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366]">
              <WhatsAppIcon className="relative h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold text-navy-800">{t.home.whatsappTitle}</h2>
            <p className="mt-3 text-slate-600">{t.home.whatsappText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white hover:bg-[#1ebe5b]">
                  <WhatsAppIcon className="h-5 w-5" /> {t.common.chatOnWhatsApp}
                </a>
              )}
              <ButtonLink href={l("/contact")} variant="outline" size="lg">{t.common.contactUs}</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
