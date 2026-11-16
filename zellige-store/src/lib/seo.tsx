import type { Metadata } from "next";
import { locales, ogLocale, type Locale } from "./i18n/config";
import { siteUrl } from "./utils";

/** Canonical + hreflang alternates for a path that exists in every locale ("/shop", "/product/x"). */
export function pageMetadata(opts: { locale: Locale; path: string; title: string; description?: string; image?: string | null; noindex?: boolean; siteName: string }): Metadata {
  const path = opts.path === "/" ? "" : opts.path;
  const url = `${siteUrl()}/${opts.locale}${path}`;
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : `${siteUrl()}${opts.image}`) : undefined;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `${siteUrl()}/${l}${path}`])), "x-default": `${siteUrl()}/fr${path}` },
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: opts.siteName,
      locale: ogLocale[opts.locale],
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: opts.title, description: opts.description, images: image ? [image] : undefined },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
  };
}

export function JsonLd({ data }: { data: unknown }) {
  // "<" is escaped so that product text can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const absolute = (u: string) => (u.startsWith("http") ? u : `${siteUrl()}${u}`);
