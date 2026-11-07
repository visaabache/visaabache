import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { dir, htmlLang, isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { RevealObserver } from "@/components/layout/reveal";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#102747", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const s = await getSettings();
  return {
    metadataBase: new URL(appUrl()),
    applicationName: "VISA ABACHE",
    verification: s.seo.googleSiteVerification ? { google: s.seo.googleSiteVerification } : undefined,
    other: { "content-language": isLocale(locale) ? htmlLang[locale] : "fr-MA" },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const settings = await getSettings();
  return (
    <html lang={htmlLang[locale]} dir={dir(locale)}>
      <body className="min-h-screen">
        {children}
        <RevealObserver />
        <CookieConsent
          gaId={settings.seo.gaMeasurementId || undefined}
          policyHref={`/${locale}/legal/cookies`}
          labels={{ ...dict.cookie, policy: dict.footer.cookies }}
        />
      </body>
    </html>
  );
}
