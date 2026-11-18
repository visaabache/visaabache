import { HandUnderline } from "@/components/site/home-hero";
import Link from "@/components/ui/link";
import { ArrowRight, Check, Star } from "lucide-react";
import type { Country, Package, Service, Testimonial } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { formatDate, formatMAD, fmt, tr, trList } from "@/lib/i18n/localized";
import { toNumber, cn } from "@/lib/utils";
import { Card, Flag, Badge } from "@/components/ui/misc";
import { DynamicIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button";
import { servicePhotoSrc, servicePhotoTallSrc } from "@/lib/service-photos";

export function CountryCard({ c, locale, dict }: { c: Country; locale: Locale; dict: Dictionary }) {
  return (
    <Link
      href={`/${locale}/visas/${c.slug}`}
      className="spotlight group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-soft"
    >
      <Flag code={c.isoCode} className="h-8 w-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy-800">{tr(c.name, locale)}</p>
        {c.isSchengen && <p className="text-xs text-slate-500">{dict.visas.schengen}</p>}
      </div>
      <ArrowRight className="rtl-flip h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

export function ServicePrice({ s, locale, dict, light }: { s: Pick<Service, "priceType" | "price">; locale: Locale; dict: Dictionary; light?: boolean }) {
  if (s.priceType === "QUOTE" || s.price == null) return <span className={cn("text-sm font-semibold", light ? "text-white" : "text-navy-700")}>{dict.common.onQuote}</span>;
  return (
    <span className={cn("text-sm", light ? "text-white/80" : "text-slate-500")}>
      {s.priceType === "FROM" && <>{dict.common.from} </>}
      <span className={cn("text-base font-bold", light ? "text-white" : "text-navy-800")}>{formatMAD(toNumber(s.price), locale)}</span>
    </span>
  );
}

/** Photo for a service (16:10, self-hosted webp), or null when the service has none. */
export function ServicePhotoImg({ slug, className, sizes, priority, tall }: { slug: string; className?: string; sizes: string; priority?: boolean; tall?: boolean }) {
  const small = servicePhotoSrc(slug, 480);
  if (!small) return null;
  // Tall cards: the portrait crop on narrow screens' landscape layout would be cut; use it from the lg breakpoint.
  const portrait = tall ? servicePhotoTallSrc(slug) : null;
  return (
    <picture className="contents">
      {portrait && <source media="(min-width: 1024px)" srcSet={portrait} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
      src={small}
      srcSet={`${small} 480w, ${servicePhotoSrc(slug, 960)} 960w`}
      sizes={sizes}
      alt=""
      width={480}
      height={300}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      />
    </picture>
  );
}

export function ServiceCard({ s, locale, dict }: { s: Service; locale: Locale; dict: Dictionary }) {
  const hasPhoto = !!servicePhotoSrc(s.slug, 480);
  return (
    <Link href={`/${locale}/services/${s.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition duration-300 group-hover:-translate-y-1 group-hover:border-gold-300 group-hover:shadow-premium">
        <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
          {hasPhoto ? (
            <ServicePhotoImg slug={s.slug} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-navy-300"><DynamicIcon name={s.icon} className="h-14 w-14" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 via-transparent to-transparent" aria-hidden />
          <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-800 shadow-sm">{dict.services.categories[s.category]}</span>
        </div>
        <div className="relative flex flex-1 flex-col px-6 pb-6 pt-9">
          <span className="absolute -top-7 start-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold-400 shadow-[0_10px_24px_-8px_rgba(16,39,71,.55)] ring-4 ring-white transition duration-300 group-hover:bg-gold-500 group-hover:text-navy-900">
            <DynamicIcon name={s.icon} className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-semibold leading-snug text-navy-800">{tr(s.name, locale)}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tr(s.shortDescription, locale)}</p>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <ServicePrice s={s} locale={locale} dict={dict} />
            <span className="flex items-center gap-1 text-sm font-semibold text-gold-700">
              {dict.common.learnMore} <ArrowRight className="rtl-flip h-4 w-4 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function PackageCard({ p, locale, dict, href }: { p: Package; locale: Locale; dict: Dictionary; href: string }) {
  const features = trList(p.features, locale);
  const hi = p.isHighlighted;
  return (
    <div className={cn("relative flex flex-col rounded-2xl border p-7 transition", hi ? "border-gold-400 bg-navy-800 text-white shadow-premium lg:-mt-4 lg:mb-4" : "border-slate-200 bg-white shadow-soft")}>
      {(hi || p.isPromotional) && (
        <span className={cn("absolute -top-3 start-6 rounded-full px-3 py-1 text-xs font-bold", hi ? "bg-gold-500 text-navy-900" : "bg-red-500 text-white")}>
          {p.isPromotional ? dict.pricing.promo : dict.pricing.popular}
        </span>
      )}
      <h3 className={cn("text-lg font-semibold", hi ? "text-white" : "text-navy-800")}>{tr(p.name, locale)}</h3>
      <p className={cn("mt-1 text-sm", hi ? "text-navy-100" : "text-slate-500")}>{tr(p.description, locale)}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className={cn("text-4xl font-bold", hi ? "text-gold-400" : "text-navy-800")}>{formatMAD(toNumber(p.price), locale)}</span>
        {p.compareAtPrice && <span className="text-sm text-slate-400 line-through">{formatMAD(toNumber(p.compareAtPrice), locale)}</span>}
      </div>
      <p className={cn("text-xs", hi ? "text-navy-200" : "text-slate-400")}>
        {dict.common.perPerson}
        {p.isPromotional && p.promoEndsAt ? ` · ${fmt(dict.pricing.until, { date: formatDate(p.promoEndsAt, locale) })}` : ""}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", hi ? "text-gold-400" : "text-emerald-600")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <ButtonLink href={href} variant={hi ? "primary" : "outline"} size="lg" className="mt-7 w-full">
        {dict.pricing.choose}
      </ButtonLink>
    </div>
  );
}

export function TestimonialCard({ t, locale, dict }: { t: Testimonial & { country: Country | null }; locale: Locale; dict: Dictionary }) {
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex gap-0.5 text-gold-500" aria-label={`${t.rating}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-4 w-4", i < t.rating ? "fill-current" : "text-slate-200")} />
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700" lang={t.locale}>
        “{t.content}”
      </blockquote>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div>
          <p className="text-sm font-semibold text-navy-800">{t.displayName}</p>
          <p className="text-xs text-slate-500">{[t.city, t.country ? tr(t.country.name, locale) : null].filter(Boolean).join(" · ")}</p>
        </div>
        <Badge tone="green">{dict.home.verifiedClient}</Badge>
      </div>
    </Card>
  );
}

export function FaqList({ items, locale }: { items: { id: string; question: unknown; answer: unknown }[]; locale: Locale }) {
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((f) => (
        <details key={f.id} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-800">
            {tr(f.question, locale)}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{tr(f.answer, locale)}</p>
        </details>
      ))}
    </div>
  );
}

export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="paper relative overflow-hidden text-navy-900">
      <div className="container relative pb-16 pt-12 sm:pb-20 sm:pt-16">
        <h1 className="max-w-3xl animate-fade-up font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        <HandUnderline className="mt-3 block h-3 w-40 text-gold-500 sm:w-52" />
        {subtitle && <p className="mt-6 max-w-2xl animate-fade-up text-lg text-slate-700 [animation-delay:.15s]">{subtitle}</p>}
        {children}
      </div>
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-0 h-6 w-full text-white sm:h-8">
        <path d="M0 26c160-10 300 8 470 2s260-22 460-18 330 22 510 14v16H0z" fill="currentColor" />
      </svg>
    </section>
  );
}
