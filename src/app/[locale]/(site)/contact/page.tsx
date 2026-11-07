import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/utils";
import { submitInquiry } from "@/actions/public";
import { PageHero } from "@/components/site/cards";
import { Card } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/ui/icons";
import { InquiryForm } from "@/components/forms/inquiry-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: t.contact.title, description: t.contact.subtitle });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const [s, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const b = s.business;
  const wa = s.whatsapp.enabled ? whatsappLink(s.whatsapp.number, tr(s.whatsapp.defaultMessage, locale)) : "";
  const labels = { name: t.common.name, email: t.common.email, phone: t.common.phone, subject: t.contact.subject, message: t.common.message, consent: t.contact.consent, send: t.common.send, privacy: t.footer.privacy };
  const defaults = user ? { name: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phone || "" } : undefined;
  return (
    <>
      <PageHero title={t.contact.title} subtitle={t.contact.subtitle} />
      <section className="container grid grid-cols-1 gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-6 sm:p-8">
          <h2 className="mb-5 font-display text-2xl font-semibold text-navy-800">{t.contact.formTitle}</h2>
          <InquiryForm action={submitInquiry.bind(null, locale)} type="CONTACT" showSubject privacyHref={`/${locale}/legal/privacy`} labels={labels} defaults={defaults} />
        </Card>
        <div className="space-y-6">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#25D366] p-5 text-white shadow-soft transition hover:bg-[#1ebe5b]">
              <WhatsAppIcon className="h-9 w-9" />
              <span className="font-semibold">{t.common.chatOnWhatsApp}</span>
            </a>
          )}
          <Card className="space-y-4 p-6 text-sm">
            <h2 className="font-semibold text-navy-800">{t.contact.office}</h2>
            <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-gold-600" /><a dir="ltr" href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a></p>
            <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold-600" /><a href={`mailto:${b.email}`}>{b.email}</a></p>
            <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-gold-600" /><span>{[b.address, b.city].filter(Boolean).join(", ")}<br /><span className="text-xs text-slate-500">{t.contact.byAppointment}</span></span></p>
            <p className="flex items-center gap-3"><Clock className="h-4 w-4 text-gold-600" />{tr(b.hours, locale)}</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-navy-800">{t.contact.consultationTitle}</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">{t.contact.consultationText}</p>
            <InquiryForm action={submitInquiry.bind(null, locale)} type="CONSULTATION" privacyHref={`/${locale}/legal/privacy`} labels={labels} defaults={defaults} />
          </Card>
        </div>
      </section>
    </>
  );
}
