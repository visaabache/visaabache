import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Circle, Clock, ExternalLink, FileText, Landmark, ListChecks, Receipt, Route, ShieldCheck } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, fmt, tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { packagesForCountry } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { appUrl, toNumber, whatsappLink } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, Flag, Prose } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/ui/icons";
import { FaqList } from "@/components/site/cards";
import { SetWhatsAppMessage } from "@/components/layout/whatsapp";
import { Aurora } from "@/components/motion/aurora";

async function load(slug: string) {
  return prisma.country.findFirst({
    where: { slug, isActive: true },
    include: {
      visaTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      checklistItems: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      faqs: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const c = await load(slug);
  if (!c) return {};
  const name = tr(c.name, locale);
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    path: `/visas/${slug}`,
    title: tr(c.seoTitle, locale) || `${t.nav.visas} ${name}`,
    description: tr(c.seoDescription, locale) || tr(c.summary, locale),
  });
}

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-2xl font-semibold text-navy-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
          <Icon className="h-5 w-5" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CountryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const c = await load(slug);
  if (!c) notFound();
  const [packages, settings] = await Promise.all([packagesForCountry(c.slug), getSettings()]);
  const name = tr(c.name, locale);
  const typeName = (code: string) => c.visaTypes.find((v) => v.code === code)?.name;
  const waText = `${tr(settings.whatsapp.defaultMessage, locale)} (${t.nav.visas}: ${name})`;
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, waText) : "";
  const applyHref = `/${locale}/apply?country=${c.slug}`;

  const md = (v: unknown) => renderMarkdown(tr(v, locale));
  const toc = [
    ["types", t.country.visaTypes],
    ["eligibility", t.country.eligibility],
    ["checklist", t.country.checklist],
    ["procedure", t.country.procedure],
    ["appointment", t.country.appointment],
    ["fees", t.country.officialFees],
    ["links", t.country.officialLinks],
    ["prices", t.country.ourPrices],
  ];

  return (
    <>
      <SetWhatsAppMessage text={waText} />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.nav.home, item: appUrl(`/${locale}`) },
              { "@type": "ListItem", position: 2, name: t.nav.visas, item: appUrl(`/${locale}/visas`) },
              { "@type": "ListItem", position: 3, name, item: appUrl(`/${locale}/visas/${c.slug}`) },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${t.common.applyForAssistance} — ${name}`,
            provider: { "@type": "ProfessionalService", name: "VISA ABACHE" },
            areaServed: "MA",
            offers: packages.map((p) => ({ "@type": "Offer", name: tr(p.name, locale), price: toNumber(p.price), priceCurrency: "MAD" })),
          },
          ...(c.faqs.length
            ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: tr(f.question, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.answer, locale) } })) }]
            : []),
        ]}
      />

      <section className="noise relative overflow-hidden bg-navy-950 text-white">
        <Aurora />
        <div className="bg-grid mask-radial absolute inset-0 opacity-40" aria-hidden />
        <div className="container relative py-12 sm:py-16">
          <nav className="mb-6 text-sm text-navy-200" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-white">{t.nav.home}</Link> / <Link href={`/${locale}/visas`} className="hover:text-white">{t.nav.visas}</Link> / <span className="text-white">{name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-5">
            <Flag code={c.isoCode} className="h-14 w-20 animate-float rounded-md shadow-premium" alt={name} />
            <div>
              <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t.nav.visas} — {name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.isSchengen && <Badge tone="gold">{t.visas.schengen}</Badge>}
                <Badge tone="navy" className="bg-white/10 text-white ring-white/20">{t.regions[c.region]}</Badge>
              </div>
            </div>
          </div>
          {c.summary && <p className="mt-6 max-w-3xl text-lg text-navy-100">{tr(c.summary, locale)}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={applyHref} size="lg">
              {fmt(t.country.applyCta, { country: name })} <ArrowRight className="rtl-flip h-4 w-4" />
            </ButtonLink>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 font-semibold backdrop-blur hover:bg-white/20">
                <WhatsAppIcon className="h-5 w-5" /> {t.common.chatOnWhatsApp}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container grid grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {c.lastVerifiedAt ? (
            <Alert tone="success">{fmt(t.country.verifiedOn, { date: formatDate(c.lastVerifiedAt, locale) })}. {t.country.officialLinksNote}</Alert>
          ) : (
            <Alert tone="warning">{t.country.notVerified}</Alert>
          )}

          <Section id="types" icon={FileText} title={t.country.visaTypes}>
            {c.visaTypes.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {c.visaTypes.map((v) => (
                  <Card key={v.id} className="p-5">
                    <h3 className="font-semibold text-navy-800">{tr(v.name, locale)}</h3>
                    {v.description && <p className="mt-1.5 text-sm text-slate-600">{tr(v.description, locale)}</p>}
                    <dl className="mt-3 space-y-1.5 text-xs text-slate-500">
                      {v.processingInfo && (
                        <div className="flex gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" /><dd>{t.country.processing} ({t.common.indicative.toLowerCase()}): {tr(v.processingInfo, locale)}</dd></div>
                      )}
                      {v.officialFee && (
                        <div className="flex gap-1.5"><Landmark className="h-3.5 w-3.5 shrink-0" /><dd>{t.country.officialFees}: {tr(v.officialFee, locale)}</dd></div>
                      )}
                    </dl>
                    <Link href={`${applyHref}&type=${v.code}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:text-gold-800">
                      {t.common.applyNow} <ArrowRight className="rtl-flip h-3.5 w-3.5" />
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">{t.country.notAvailable}</p>
            )}
          </Section>

          <Section id="eligibility" icon={ShieldCheck} title={t.country.eligibility}>
            {c.eligibility ? <Prose html={md(c.eligibility)} /> : <p className="text-slate-500">{t.country.notAvailable}</p>}
          </Section>

          <Section id="checklist" icon={ListChecks} title={t.country.checklist}>
            <p className="mb-4 text-sm text-slate-500">{t.country.checklistNote}</p>
            {c.checklistItems.length ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {c.checklistItems.map((i) => {
                  const conditional = Boolean(i.condition) || i.visaTypeCodes.length > 0 || !i.required;
                  return (
                    <li key={i.id} className="flex gap-3 p-4">
                      {conditional ? <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
                      <div className="min-w-0">
                        <p className="font-medium text-navy-800">
                          {tr(i.title, locale)}{" "}
                          <span className={conditional ? "text-xs font-normal text-slate-400" : "text-xs font-normal text-emerald-700"}>
                            · {conditional ? t.country.conditionalDoc : t.country.requiredDoc}
                            {i.visaTypeCodes.length > 0 && ` (${i.visaTypeCodes.map((code) => tr(typeName(code), locale) || code).join(", ")})`}
                          </span>
                        </p>
                        {i.description && <p className="mt-0.5 text-sm text-slate-500">{tr(i.description, locale)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">{t.country.notAvailable}</p>
            )}
          </Section>

          <Section id="procedure" icon={Route} title={t.country.procedure}>
            {c.procedure ? <Prose html={md(c.procedure)} /> : <p className="text-slate-500">{t.country.notAvailable}</p>}
          </Section>

          <Section id="appointment" icon={CalendarClock} title={t.country.appointment}>
            {c.appointmentInfo ? <Prose html={md(c.appointmentInfo)} /> : <p className="text-slate-500">{t.country.notAvailable}</p>}
            {c.processingInfo && (
              <Card className="mt-6 border-sky-100 bg-sky-50/50 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-navy-800">
                  <Clock className="h-4 w-4" /> {t.country.processing} <Badge tone="blue">{t.common.indicative}</Badge>
                </h3>
                <p className="mt-2 text-sm text-slate-700">{tr(c.processingInfo, locale)}</p>
                <p className="mt-2 text-xs text-slate-500">{t.country.processingNote}</p>
              </Card>
            )}
          </Section>

          <Section id="fees" icon={Landmark} title={t.country.officialFees}>
            <Card className="border-amber-100 bg-amber-50/40 p-5">
              <p className="text-sm text-slate-700">{c.officialFeesInfo ? tr(c.officialFeesInfo, locale) : t.country.notAvailable}</p>
              <p className="mt-2 text-xs font-medium text-amber-800">{t.country.officialFeesNote}</p>
            </Card>
          </Section>

          {c.importantNotes && tr(c.importantNotes, locale) && (
            <Alert tone="warning" title={t.country.importantNotes}>
              <Prose html={md(c.importantNotes)} className="prose-sm" />
            </Alert>
          )}

          <Section id="links" icon={ExternalLink} title={t.country.officialLinks}>
            <p className="mb-4 text-sm text-slate-500">{t.country.officialLinksNote}</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {c.links.map((lnk) => (
                <li key={lnk.id}>
                  <a href={lnk.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:shadow-soft">
                    <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
                    <span className="min-w-0">
                      <span className="block font-medium text-navy-800">{tr(lnk.label, locale)}</span>
                      <span className="block truncate text-xs text-slate-500" dir="ltr">{lnk.url.replace(/^https?:\/\//, "")}</span>
                    </span>
                    <ExternalLink className="ms-auto h-4 w-4 shrink-0 text-slate-400" />
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="prices" icon={Receipt} title={t.country.ourPrices}>
            <p className="mb-4 text-sm text-slate-500">{t.country.ourPricesNote}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {packages.map((p) => (
                <Card key={p.id} className={p.isHighlighted ? "border-gold-400 p-5 ring-1 ring-gold-300" : "p-5"}>
                  <p className="font-semibold text-navy-800">{tr(p.name, locale)}</p>
                  <p className="mt-1 text-2xl font-bold text-navy-800">{formatMAD(toNumber(p.price), locale)}</p>
                  <p className="mt-1 text-xs text-slate-500">{tr(p.description, locale)}</p>
                  <ButtonLink href={`${applyHref}&package=${p.slug}`} size="sm" variant={p.isHighlighted ? "primary" : "outline"} className="mt-4 w-full">
                    {t.pricing.choose}
                  </ButtonLink>
                </Card>
              ))}
            </div>
          </Section>

          {c.faqs.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-navy-800">{t.country.faq}</h2>
              <FaqList items={c.faqs} locale={locale} />
            </section>
          )}

          <Alert tone="info">{t.common.independentNotice}</Alert>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-navy-800 p-5 text-white">
              <p className="text-sm text-navy-200">{t.country.ourPrices}</p>
              {packages[0] && (
                <p className="mt-1 text-2xl font-bold text-gold-400">
                  {t.common.from} {formatMAD(Math.min(...packages.map((p) => toNumber(p.price))), locale)}
                </p>
              )}
            </div>
            <div className="space-y-3 p-5">
              <ButtonLink href={applyHref} size="lg" className="w-full">
                {t.common.applyNow}
              </ButtonLink>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1ebe5b]">
                  <WhatsAppIcon className="h-4 w-4" /> {t.common.chatOnWhatsApp}
                </a>
              )}
              <p className="flex items-start gap-1.5 text-xs text-slate-500">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t.common.noGuarantee}
              </p>
            </div>
          </Card>
          <Card className="hidden p-5 lg:block">
            <ul className="space-y-1.5 text-sm">
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded px-2 py-1 text-slate-600 hover:bg-navy-50 hover:text-navy-800">{label}</a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
