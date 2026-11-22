import type { Metadata } from "next";
import { locales, type Locale } from "./i18n/config";
import { tr } from "./i18n/localized";
import { getSettings } from "./settings";
import { appUrl } from "./utils";

export async function pageMetadata(opts: {
  locale: Locale;
  path: string; // path without locale, e.g. "/visas/france"
  title?: string;
  description?: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}): Promise<Metadata> {
  const s = await getSettings();
  const siteTitle = tr(s.seo.siteTitle, opts.locale);
  const description = opts.description || tr(s.seo.siteDescription, opts.locale);
  const title = opts.title ? `${opts.title} | VISA ABACHE` : siteTitle;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l === "ar" ? "ar-MA" : l === "fr" ? "fr-MA" : "en"] = appUrl(`/${l}${opts.path}`);
  languages["x-default"] = appUrl(`/fr${opts.path}`);
  const image = opts.image || s.seo.ogImageUrl || appUrl("/brand/visa-abache-social-1200x630.jpg");
  return {
    title: { absolute: title },
    description,
    keywords: tr(s.seo.keywords, opts.locale) || undefined,
    alternates: { canonical: appUrl(`/${opts.locale}${opts.path}`), languages },
    openGraph: {
      title,
      description,
      url: appUrl(`/${opts.locale}${opts.path}`),
      siteName: "VISA ABACHE",
      locale: opts.locale === "ar" ? "ar_MA" : opts.locale === "fr" ? "fr_MA" : "en_US",
      type: opts.type || "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/**
 * Business profile for search engines (schema.org TravelAgency, a LocalBusiness): name, logo, city, phone, opening
 * hours, social profiles and the Moroccan cities served. One node with a stable @id, referenced by other pages.
 */
export function businessJsonLd(s: Awaited<ReturnType<typeof getSettings>>, locale: Locale, areaServedText: string) {
  const b = s.business;
  const phone = b.phone ? (b.phone.trim().startsWith("0") ? `+212${b.phone.replace(/\D/g, "").slice(1)}` : b.phone.trim()) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": appUrl("/#organization"),
    name: b.name || "VISA ABACHE",
    url: appUrl(`/${locale}`),
    logo: appUrl("/brand/visa-abache-icon-512.png"),
    image: appUrl("/brand/visa-abache-social-1200x630.jpg"),
    description: tr(s.seo.siteDescription, locale),
    telephone: phone,
    address: { "@type": "PostalAddress", streetAddress: b.address || undefined, addressLocality: b.city || undefined, addressCountry: "MA" },
    areaServed: [{ "@type": "Country", name: "Morocco" }, { "@type": "Place", name: areaServedText }],
    knowsLanguage: ["fr", "ar", "en"],
    priceRange: "MAD",
    currenciesAccepted: "MAD",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: Object.values(s.seo.social).filter(Boolean),
  };
}
