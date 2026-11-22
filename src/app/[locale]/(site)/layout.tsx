import type { ReactNode } from "react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { businessJsonLd, JsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp";
import { PromoBanner } from "@/components/layout/promo-banner";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SpotlightTracker } from "@/components/motion/spotlight-tracker";

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const dict = getDictionary(locale);
  const [settings, user, popularRows] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    prisma.country.findMany({ where: { isActive: true, isPopular: true }, orderBy: { sortOrder: "asc" }, take: 12, select: { slug: true, name: true } }),
  ]);
  const popular = popularRows.map((c) => ({ slug: c.slug, name: tr(c.name, locale) }));
  const now = new Date();
  const banner = await prisma.banner.findFirst({
    where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <SpotlightTracker />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      {banner && <PromoBanner banner={banner} locale={locale} />}
      <Header locale={locale} dict={dict} user={user} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} dict={dict} settings={settings} popular={popular} />
      <JsonLd data={businessJsonLd(settings, locale, dict.seo.areaServed)} />
      {settings.whatsapp.enabled && (
        <WhatsAppFloat number={settings.whatsapp.number} defaultMessage={tr(settings.whatsapp.defaultMessage, locale)} label={dict.common.chatOnWhatsApp} />
      )}
    </div>
  );
}
