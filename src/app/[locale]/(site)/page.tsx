import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck, HeartHandshake, Lock, MapPinned, ScrollText, ShieldCheck, Sparkles, UserRoundCheck, Wallet, Plane } from "lucide-react";
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
import { WhatsAppIcon } from "@/components/ui/icons";
import { FaqList, ServiceCard, TestimonialCard } from "@/components/site/cards";
import { DestinationSearch } from "@/components/site/destination-search";
import { Aurora } from "@/components/motion/aurora";
import { FlagMarquee } from "@/components/motion/marquee";
import { HeroVisual } from "@/components/motion/hero-visual";
import { AnimatedHeadline } from "@/components/motion/animated-headline";
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
    { icon: MapPinned, title: t.home.step1Title, text: t.home.step1Text },
    { icon: ScrollText, title: t.home.step2Title, text: t.home.step2Text },
    { icon: FileCheck, title: t.home.step3Title, text: t.home.step3Text },
    { icon: UserRoundCheck, title: t.home.step4Title, text: t.home.step4Text },
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
          "@type": "ProfessionalService",
          name: "VISA ABACHE",
          slogan: t.meta.tagline,
          url: appUrl(`/${locale}`),
          email: settings.business.email,
          telephone: settings.business.phone,
          areaServed: { "@type": "Country", name: "Morocco" },
          address: { "@type": "PostalAddress", addressLocality: settings.business.city, streetAddress: settings.business.address || undefined, addressCountry: "MA" },
          priceRange: "MAD",
          availableLanguage: ["fr", "ar", "en"],
          sameAs: Object.values(settings.seo.social).filter(Boolean),
        }}
      />
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: tr(f.question, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.answer, locale) } })) }} />
      )}

      {/* ───────────── Hero ───────────── */}
      <section className="noise relative overflow-hidden bg-navy-950 text-white">
        <Aurora />
        <div className="bg-grid mask-radial absolute inset-0 opacity-50" aria-hidden />
        <div className="container relative grid items-center gap-10 pb-10 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:pb-16">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
              </span>
              {t.home.heroBadge}
            </p>
            <AnimatedHeadline
              text={t.home.heroTitle}
              highlight={[t.home.heroHighlight]}
              delay={0.1}
              className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl"
            />
            <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-navy-100 [animation-delay:.5s] sm:text-lg">{t.home.heroSubtitle}</p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:.65s]">
              <ButtonLink href={l("/apply")} size="lg" className="btn-shine shadow-[0_10px_40px_-10px_rgba(201,164,92,.8)]">
                {t.common.applyForAssistance} <ArrowRight className="rtl-flip h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={l("/services")} size="lg" variant="light">
                {t.common.exploreServices}
              </ButtonLink>
            </div>
            <div className="relative z-10 mt-8 animate-fade-up [animation-delay:.8s]">
              <DestinationSearch
                items={countries.map((c) => ({ slug: c.slug, name: tr(c.name, locale), iso: c.isoCode }))}
                locale={locale}
                placeholder={t.home.searchPlaceholder}
                button={t.home.searchButton}
              />
            </div>
            <ul className="mt-6 flex animate-fade-up flex-wrap gap-2 text-xs text-navy-100 [animation-delay:.95s] sm:text-sm">
              {[t.home.trust1, t.home.trust2, t.home.trust3].map((x) => (
                <li key={x} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold-400" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up [animation-delay:.3s]">
            <HeroVisual
              flags={popular.map((c) => c.isoCode)}
              more={Math.max(0, countries.length - 4)}
              labels={{
                status: t.home.heroCardStatus,
                statusValue: t.home.heroCardStatusValue,
                docs: t.home.heroCardDocs,
                next: t.home.heroCardNext,
                secure: t.home.heroCardSecure,
                example: t.home.heroCardExample,
              }}
            />
          </div>
        </div>
        {/* Destinations marquee */}
        <div className="relative space-y-1 pb-24 pt-2">
          <p className="container mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-navy-300 sm:text-xs sm:tracking-[0.25em]">{t.home.marqueeTitle}</p>
          <FlagMarquee items={chips.slice(0, half)} />
          <FlagMarquee items={chips.slice(half)} reverse />
        </div>
      </section>

      {/* ───────────── Stats (overlapping the hero) ───────────── */}
      <section className="container relative z-10 -mt-14">
        <div className="reveal-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="spotlight rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-premium">
              <p className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
                {s.prefix}
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
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
          {popular.map((c) => (
            <Link
              key={c.id}
              href={l(`/visas/${c.slug}`)}
              className="spotlight group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-premium sm:p-5"
            >
              <div className="flex items-center justify-between">
                <Flag code={c.isoCode} className="h-9 w-14 rounded-md transition duration-500 group-hover:scale-110 sm:h-10 sm:w-16" />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition group-hover:bg-gold-500 group-hover:text-navy-900">
                  <ArrowRight className="rtl-flip h-4 w-4 -rotate-45 transition group-hover:rotate-0" />
                </span>
              </div>
              <div>
                <p className="font-semibold text-navy-800">{tr(c.name, locale)}</p>
                <p className="text-xs text-slate-500">{c.isSchengen ? t.visas.schengen : t.regions[c.region]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Services (bento) ───────────── */}
      <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24">
        <Aurora variant="light" className="opacity-60" />
        <div className="container relative">
          <SectionHeading eyebrow={t.nav.services} title={t.home.servicesTitle} subtitle={t.home.servicesSubtitle} center className="reveal" />
          <div className="reveal-stagger mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s, i) =>
              i === 0 ? (
                <Link key={s.id} href={l(`/services/${s.slug}`)} className="border-glow spotlight group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-navy-900 p-7 text-white shadow-premium sm:col-span-2 lg:row-span-2 lg:col-span-1">
                  <Aurora className="opacity-70" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-300"><Sparkles className="h-3.5 w-3.5" />{t.services.categories[s.category]}</span>
                    <h3 className="mt-5 font-display text-3xl font-semibold leading-tight">{tr(s.name, locale)}</h3>
                    <p className="mt-3 text-navy-100">{tr(s.shortDescription, locale)}</p>
                  </div>
                  <div className="relative mt-10 flex items-center justify-between">
                    <Plane className="h-16 w-16 -rotate-12 text-gold-400/80 transition duration-700 group-hover:-translate-y-2 group-hover:translate-x-3 rtl:group-hover:-translate-x-3" />
                    <span className="flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-navy-900">{t.common.learnMore} <ArrowRight className="rtl-flip h-4 w-4" /></span>
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
        <ol className="reveal-stagger relative mt-14 grid gap-6 md:grid-cols-4">
          <div aria-hidden className="absolute inset-x-[12%] top-8 hidden h-0.5 overflow-hidden rounded-full bg-gold-100 md:block">
            <div className="h-full w-1/3 animate-[marquee-reverse_3.5s_linear_infinite] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
          </div>
          {steps.map((s, i) => (
            <li key={s.title} className="spotlight group relative rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-premium">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-2xl bg-navy-800 transition duration-500 group-hover:rotate-12 group-hover:bg-gold-500" />
                <s.icon className="relative h-7 w-7 text-gold-400 transition group-hover:text-navy-900" />
                <span className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900 ring-4 ring-white">{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold text-navy-800">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Why choose ───────────── */}
      <section className="noise relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
        <Aurora />
        <div className="bg-grid mask-radial absolute inset-0 opacity-40" aria-hidden />
        <div className="container relative">
          <SectionHeading eyebrow="VISA ABACHE" title={t.home.whyTitle} light center className="reveal" />
          <div className="reveal-stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whys.map((w) => (
              <div key={w.title} className="border-glow glass spotlight group rounded-3xl p-6 transition duration-300 hover:-translate-y-1">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400 transition duration-500 group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-navy-900">
                  <w.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">{w.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-navy-300">{t.common.independentNotice}</p>
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
          <div className="reveal noise relative overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#b08944,#c9a45c,#e9d4a9,#c9a45c)] bg-[length:250%_100%] p-8 text-navy-900 shadow-premium animate-gradient-x sm:p-12">
            <Plane className="absolute -end-6 -top-6 h-40 w-40 rotate-12 animate-float-slow text-white/30" aria-hidden />
            <h2 className="relative max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">{t.home.ctaTitle}</h2>
            <p className="relative mt-3 max-w-md text-navy-800">{t.home.ctaText}</p>
            <ButtonLink href={l("/apply")} variant="navy" size="lg" className="btn-shine relative mt-7">
              {t.common.applyForAssistance} <ArrowRight className="rtl-flip h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal spotlight relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366]">
              <span className="absolute inset-0 animate-ping2 rounded-2xl bg-[#25D366]/20" />
              <WhatsAppIcon className="relative h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold text-navy-800">{t.home.whatsappTitle}</h2>
            <p className="mt-3 text-slate-600">{t.home.whatsappText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-shine inline-flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white hover:bg-[#1ebe5b]">
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
