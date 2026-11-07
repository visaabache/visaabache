import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import type { SettingsMap } from "@/lib/settings";
import { SocialIcon, WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/utils";
import { Logo } from "./logo";
import { CookieSettingsLink } from "./cookie-consent";

export function Footer({ locale, dict, settings }: { locale: Locale; dict: Dictionary; settings: SettingsMap }) {
  const l = (p: string) => `/${locale}${p}`;
  const b = settings.business;
  const socials = Object.entries(settings.seo.social).filter(([, url]) => url);
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, tr(settings.whatsapp.defaultMessage, locale)) : "";

  return (
    <footer className="no-print bg-navy-900 text-navy-100">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo className="h-16" />
          <p className="text-sm leading-relaxed text-navy-200">{dict.footer.about}</p>
          <p className="text-xs italic text-gold-300">{dict.meta.tagline}</p>
          {socials.length > 0 && (
            <div className="flex gap-3">
              {socials.map(([net, url]) => (
                <a key={net} href={url} target="_blank" rel="noopener noreferrer" aria-label={net} className="rounded-full bg-white/10 p-2 transition hover:bg-gold-500 hover:text-navy-900">
                  <SocialIcon network={net} className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.quickLinks}</h3>
          <ul className="space-y-2 text-sm">
            {[
              [l("/visas"), dict.nav.visas],
              [l("/services"), dict.nav.services],
              [l("/pricing"), dict.nav.pricing],
              [l("/apply"), dict.common.applyForAssistance],
              [l("/track"), dict.nav.track],
              [l("/blog"), dict.nav.blog],
              [l("/faq"), dict.nav.faq],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.legal}</h3>
          <ul className="space-y-2 text-sm">
            {[
              [l("/legal/privacy"), dict.footer.privacy],
              [l("/legal/terms"), dict.footer.terms],
              [l("/legal/refunds"), dict.footer.refunds],
              [l("/legal/cookies"), dict.footer.cookies],
              [l("/legal/disclaimer"), dict.footer.disclaimer],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink label={dict.footer.cookieSettings} />
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.contact}</h3>
          <ul className="space-y-3 text-sm">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-[#4ee28a] hover:text-white">
                  <WhatsAppIcon className="h-4 w-4" /> {dict.common.chatOnWhatsApp}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold-400" />
              <a href={`tel:${b.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-white">
                {b.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold-400" />
              <a href={`mailto:${b.email}`} className="hover:text-white">
                {b.email}
              </a>
            </li>
            {(b.address || b.city) && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold-400" />
                <span>{[b.address, b.city].filter(Boolean).join(", ")}</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-gold-400" />
              <span>{tr(b.hours, locale)}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container space-y-2 py-6 text-xs text-navy-300">
          <p className="leading-relaxed">{dict.common.independentNotice}</p>
          <p className="flex flex-wrap justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {b.legalName || b.name}. {dict.footer.rights}
              {b.ice ? ` · ICE ${b.ice}` : ""}
              {b.rc ? ` · RC ${b.rc}` : ""}
            </span>
            <span>
              {dict.footer.cndp}
              {b.cndpDeclaration ? ` CNDP: ${b.cndpDeclaration}` : ""}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
