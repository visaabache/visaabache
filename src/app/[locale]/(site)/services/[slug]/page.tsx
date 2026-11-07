import { notFound } from "next/navigation";
import { Check, Info } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr, trList } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { renderMarkdown } from "@/lib/markdown";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { toNumber, whatsappLink } from "@/lib/utils";
import { submitInquiry } from "@/actions/public";
import { Card, Prose, Alert } from "@/components/ui/misc";
import { DynamicIcon, WhatsAppIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button";
import { PageHero, ServicePrice, FaqList } from "@/components/site/cards";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { SetWhatsAppMessage } from "@/components/layout/whatsapp";

async function load(slug: string) {
  return prisma.service.findFirst({ where: { slug, isActive: true }, include: { faqs: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const s = await load(slug);
  if (!s) return {};
  return pageMetadata({ locale, path: `/services/${slug}`, title: tr(s.seoTitle, locale) || tr(s.name, locale), description: tr(s.seoDescription, locale) || tr(s.shortDescription, locale) });
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const s = await load(slug);
  if (!s) notFound();
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const name = tr(s.name, locale);
  const features = trList(s.features, locale);
  const waText = `${tr(settings.whatsapp.defaultMessage, locale)} — ${t.nav.services}: ${name}`;
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, waText) : "";
  const description = tr(s.description, locale);

  return (
    <>
      <SetWhatsAppMessage text={waText} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name,
          description: tr(s.shortDescription, locale),
          provider: { "@type": "ProfessionalService", name: "VISA ABACHE" },
          areaServed: "MA",
          ...(s.price && s.priceType !== "QUOTE" ? { offers: { "@type": "Offer", price: toNumber(s.price), priceCurrency: "MAD" } } : {}),
        }}
      />
      <PageHero title={name} subtitle={tr(s.shortDescription, locale)}>
        <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm text-gold-300">{t.services.categories[s.category]}</p>
      </PageHero>
      <div className="container grid grid-cols-1 gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-8">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold-400">
                <DynamicIcon name={s.icon} className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.services.price}</p>
                <ServicePrice s={s} locale={locale} dict={t} />
              </div>
            </div>
            {description && description !== tr(s.shortDescription, locale) && <Prose html={renderMarkdown(description)} className="mt-6" />}
            {features.length > 0 && (
              <>
                <h2 className="mt-8 font-semibold text-navy-800">{t.services.features}</h2>
                <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
          <Alert tone="info" title={<span className="flex items-center gap-1"><Info className="h-4 w-4" /></span>}>
            {tr(s.disclaimer, locale) || t.services.disclaimerDefault}
          </Alert>
          {s.category === "VISA" && (
            <ButtonLink href={`/${locale}/apply`} size="lg">
              {t.common.applyForAssistance}
            </ButtonLink>
          )}
          {s.faqs.length > 0 && <FaqList items={s.faqs} locale={locale} />}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="font-display text-2xl font-semibold text-navy-800">{t.services.inquiryTitle}</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">{t.services.inquiryText}</p>
            <InquiryForm
              action={submitInquiry.bind(null, locale)}
              type="SERVICE"
              serviceId={s.id}
              privacyHref={`/${locale}/legal/privacy`}
              defaults={user ? { name: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phone || "" } : undefined}
              labels={{ name: t.common.name, email: t.common.email, phone: t.common.phone, subject: t.contact.subject, message: t.common.message, consent: t.contact.consent, send: t.common.send, privacy: t.footer.privacy }}
            />
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1ebe5b]">
                <WhatsAppIcon className="h-4 w-4" /> {t.common.chatOnWhatsApp}
              </a>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
