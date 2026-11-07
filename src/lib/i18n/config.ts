export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = { fr: "Français", ar: "العربية", en: "English" };
export const localeShort: Record<Locale, string> = { fr: "FR", ar: "ع", en: "EN" };
export const htmlLang: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export function dir(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function asLocale(v: unknown): Locale {
  return isLocale(v) ? v : defaultLocale;
}
