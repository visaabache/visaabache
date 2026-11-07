import type { Locale } from "./config";

export type LocalizedText = Partial<Record<Locale, string>>;
export type LocalizedList = Partial<Record<Locale, string[]>>;

/** Picks the best translation for a localized JSON field stored in the database. */
export function tr(value: unknown, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const v = value as Record<string, unknown>;
  const pick = v[locale] ?? v.fr ?? v.en ?? v.ar ?? Object.values(v)[0];
  return typeof pick === "string" ? pick : "";
}

export function trList(value: unknown, locale: Locale): string[] {
  if (!value || typeof value !== "object") return [];
  const v = value as Record<string, unknown>;
  for (const k of [locale, "fr", "en", "ar"]) {
    const arr = v[k];
    if (Array.isArray(arr) && arr.length) return arr.filter((x): x is string => typeof x === "string");
  }
  return [];
}

/** Interpolates {name} placeholders in dictionary strings. */
export function fmt(str: string, vars: Record<string, string | number>) {
  return str.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

const intlLocale: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en-GB" };

export function formatMAD(amount: number, locale: Locale) {
  const n = new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  return locale === "ar" ? `${n} د.م.` : `${n} MAD`;
}

export function formatDate(d: Date | string | null | undefined, locale: Locale, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(intlLocale[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Casablanca",
  }).format(date);
}
