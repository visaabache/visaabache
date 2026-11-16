import { htmlLang, type Locale } from "./i18n/config";

/** A display currency. All stored amounts are MAD centimes; rate converts 1 MAD into this currency. */
export type DisplayCurrency = { code: string; symbol: string; rate: number; decimals: number };

export const MAD: DisplayCurrency = { code: "MAD", symbol: "DH", rate: 1, decimals: 2 };

/** Converts MAD centimes into a decimal amount in the display currency. */
export function convert(centimes: number, currency: DisplayCurrency = MAD) {
  const value = (centimes / 100) * currency.rate;
  const f = 10 ** currency.decimals;
  return Math.round(value * f) / f;
}

export function formatMoney(centimes: number, locale: Locale, currency: DisplayCurrency = MAD) {
  const amount = convert(centimes, currency);
  if (currency.code === "MAD") {
    const n = new Intl.NumberFormat(htmlLang[locale], {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(amount);
    return locale === "ar" ? `${n} د.م.` : `${n} DH`;
  }
  try {
    return new Intl.NumberFormat(htmlLang[locale], {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: currency.decimals,
      numberingSystem: "latn",
    }).format(amount);
  } catch {
    return `${amount.toFixed(currency.decimals)} ${currency.symbol}`;
  }
}

/** "249.90" / "249,90" → 24990 centimes. Returns null for empty or invalid input. */
export function parseMoney(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(/\s/g, "").replace(/(dh|mad|د\.م\.)$/i, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** 24990 → "249.90" for form inputs. */
export function centsToInput(c: number | null | undefined) {
  if (c === null || c === undefined) return "";
  return (c / 100).toFixed(2).replace(/\.00$/, "");
}
