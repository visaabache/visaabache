import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource-variable/manrope";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, htmlLang, dir, isLocale, locales, tr } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencies, getDisplayCurrency } from "@/lib/currency";
import { getCategoryTree } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { siteUrl } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.store.name}: ${d.meta.title}`, template: `%s · ${s.store.name}` },
    description: d.meta.description,
    applicationName: s.store.name,
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#FAF6EE", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const [settings, currency, currencies, tree, user] = await Promise.all([getSettings(), getDisplayCurrency(), getCurrencies(), getCategoryTree(), getCurrentUser()]);
  const nav = tree.slice(0, 6).map((c) => ({ slug: c.slug, name: c.name, children: c.children.map((s) => ({ slug: s.slug, name: s.name })) }));
  return (
    <html lang={htmlLang[locale]} dir={dir(locale)}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory">
          {tr({ en: "Skip to content", fr: "Aller au contenu", ar: "انتقل إلى المحتوى" }, locale)}
        </a>
        <Providers locale={locale} dict={d} currency={currency} currencies={currencies} loggedIn={!!user}>
          <Suspense>
            <Header storeName={settings.store.name} categories={nav} />
          </Suspense>
          <CartDrawer />
          <main id="main">{children}</main>
          <Footer locale={locale} d={d} store={settings.store} />
        </Providers>
      </body>
    </html>
  );
}
