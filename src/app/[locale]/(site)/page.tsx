import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck, HeartHandshake, Lock, MapPinned, ScrollText, ShieldCheck, Sparkles, UserRoundCheck, Wallet } from "lucide-react";
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
import { CountryCard, FaqList, ServiceCard, TestimonialCard } from "@/components/site/cards";
import { DestinationSearch } from "@/components/site/destination-search";

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
  ].slice(0, 6) as typeof services;
  const l = (p: string) => `/${locale}${p}`;
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, tr(settings.whatsapp.defaultMessage, locale)) : "";

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
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: tr(f.question, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.answer, locale) } })),
          }}
        />
      )}

      {/* Hero */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -end-32 -top-32 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
        <div className="container relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
              <Sparkles className="h-3.5 w-3.5" /> {t.home.heroBadge}
            </p>
            <h1 className="mt-5 animate-fade-up font-display text-4xl font-semibold leading-[1.1] [animation-delay:.05s] sm:text-6xl">{t.home.heroTitle}</h1>
            <p className="mt-5 max-w-xl animate-fade-up text-lg leading-relaxed text-navy-100 [animation-delay:.1s]">{t.home.heroSubtitle}</p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:.15s]">
              <ButtonLink href={l("/apply")} size="lg">
                {t.common.applyForAssistance} <ArrowRight className="rtl-flip h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={l("/services")} size="lg" variant="light">
                {t.common.exploreServices}
              </ButtonLink>
            </div>
            <div className="mt-8 animate-fade-up [animation-delay:.2s]">
              <DestinationSearch
                items={countries.map((c) => ({ slug: c.slug, name: tr(c.name, locale), iso: c.isoCode }))}
                locale={locale}
                placeholder={t.home.searchPlaceholder}
                button={t.home.searchButton}
              />
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-100">
              {[t.home.trust1, t.home.trust2, t.home.trust3].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold-400" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative hidden lg:block">
            <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur [animation-delay:.2s]">
              <div className="grid grid-cols-2 gap-3">
                {popular.slice(0, 6).map((c) => (
                  <Link key={c.id} href={l(`/visas/${c.slug}`)} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 transition hover:bg-white/20">
                    <Flag code={c.isoCode} className="h-7 w-10" />
                    <span className="truncate text-sm font-semibold">{tr(c.name, locale)}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-white p-4 text-navy-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{t.home.step2Title}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-navy-200">{t.common.noGuarantee}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="container py-20">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={t.nav.visas} title={t.home.popularTitle} subtitle={t.home.popularSubtitle} />
          <Link href={l("/visas")} className="flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-gold-700">
            {t.common.seeAll} <ArrowRight className="rtl-flip h-4 w-4" />
          </Link>
        </div>
        <div className="reveal mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((c) => (
            <CountryCard key={c.id} c={c} locale={locale} dict={t} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-20">
        <div className="container">
          <SectionHeading eyebrow={t.nav.services} title={t.home.servicesTitle} subtitle={t.home.servicesSubtitle} center className="reveal" />
          <div className="reveal mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s) => (
              <ServiceCard key={s.id} s={s} locale={locale} dict={t} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href={l("/services")} variant="outline" size="lg">
              {t.common.exploreServices}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <SectionHeading eyebrow="1 · 2 · 3 · 4" title={t.home.howTitle} subtitle={t.home.howSubtitle} center className="reveal" />
        <ol className="reveal relative mt-14 grid gap-8 md:grid-cols-4">
          <div className="absolute inset-x-[12%] top-7 hidden h-px bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 md:block" aria-hidden />
          {steps.map((s, i) => (
            <li key={s.title} className="relative text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold-400 shadow-premium">
                <s.icon className="h-6 w-6" />
                <span className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-900">{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold text-navy-800">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why choose */}
      <section className="bg-hero relative overflow-hidden py-20 text-white">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container relative">
          <SectionHeading eyebrow="VISA ABACHE" title={t.home.whyTitle} light center className="reveal" />
          <div className="reveal mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whys.map((w) => (
              <div key={w.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10">
                <w.icon className="h-8 w-8 text-gold-400" />
                <h3 className="mt-4 font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">{w.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-navy-200">{t.common.independentNotice}</p>
        </div>
      </section>

      {/* Testimonials (verified only) */}
      <section className="container py-20">
        <SectionHeading title={t.home.testimonialsTitle} subtitle={t.home.testimonialsSubtitle} center className="reveal" />
        {testimonials.length ? (
          <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((x) => (
              <TestimonialCard key={x.id} t={x} locale={locale} dict={t} />
            ))}
          </div>
        ) : (
          <Card className="reveal mx-auto mt-10 max-w-xl p-8 text-center text-sm text-slate-500">{t.home.testimonialsEmpty}</Card>
        )}
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-slate-50 py-20">
          <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div className="reveal">
              <SectionHeading eyebrow={t.nav.faq} title={t.home.faqTitle} />
              <Link href={l("/faq")} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-gold-700">
                {t.common.seeAll} <ArrowRight className="rtl-flip h-4 w-4" />
              </Link>
            </div>
            <div className="reveal">
              <FaqList items={faqs} locale={locale} />
            </div>
          </div>
        </section>
      )}

      {/* CTA + WhatsApp */}
      <section className="container py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="reveal rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 p-8 text-navy-900 shadow-premium sm:p-10">
            <h2 className="font-display text-3xl font-semibold">{t.home.ctaTitle}</h2>
            <p className="mt-3 max-w-md text-navy-800">{t.home.ctaText}</p>
            <ButtonLink href={l("/apply")} variant="navy" size="lg" className="mt-6">
              {t.common.applyForAssistance} <ArrowRight className="rtl-flip h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal rounded-3xl border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366]">
              <WhatsAppIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold text-navy-800">{t.home.whatsappTitle}</h2>
            <p className="mt-3 text-slate-600">{t.home.whatsappText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#25D366] px-6 font-semibold text-white hover:bg-[#1ebe5b]">
                  <WhatsAppIcon className="h-5 w-5" /> {t.common.chatOnWhatsApp}
                </a>
              )}
              <ButtonLink href={l("/contact")} variant="outline" size="lg">
                {t.common.contactUs}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
