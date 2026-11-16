export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = { fr: "Français", ar: "العربية", en: "English" };
export const localeShort: Record<Locale, string> = { fr: "FR", ar: "ع", en: "EN" };
export const htmlLang: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en" };
export const ogLocale: Record<Locale, string> = { fr: "fr_MA", ar: "ar_MA", en: "en_US" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export function asLocale(v: unknown): Locale {
  return isLocale(v) ? v : defaultLocale;
}

export function dir(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Translated text stored in the database. */
export type I18nText = Partial<Record<Locale, string>>;

/** Picks the text for a locale, falling back to French, English, then Arabic. */
export function tr(value: unknown, locale: Locale): string {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  const v = value as I18nText;
  return v[locale]?.trim() || v.fr?.trim() || v.en?.trim() || v.ar?.trim() || "";
}

export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
