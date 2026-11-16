import type { I18nText } from "./i18n/config";
import { parseMoney } from "./money";

/** Reads "name.fr", "name.ar", "name.en" into { fr, ar, en } (trimmed, empty languages dropped). */
export function i18nFrom(fd: FormData, name: string, max = 20000): I18nText {
  const out: I18nText = {};
  for (const l of ["fr", "ar", "en"] as const) {
    const v = String(fd.get(`${name}.${l}`) ?? "").trim().slice(0, max);
    if (v) out[l] = v;
  }
  return out;
}

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
export const bool = (fd: FormData, k: string) => ["on", "true", "1", "yes"].includes(String(fd.get(k) ?? "").toLowerCase());
export function int(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (!s) return null;
  const n = Math.round(Number(s.replace(",", ".")));
  return Number.isFinite(n) ? n : null;
}
export function float(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export const money = (fd: FormData, k: string) => parseMoney(fd.get(k));
export const list = (s: string) => [...new Set(s.split(/[,;\n]/).map((x) => x.trim().toLowerCase()).filter(Boolean))].slice(0, 30);
export const dateOrNull = (fd: FormData, k: string) => {
  const s = str(fd, k);
  const d = s ? new Date(s) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};
export const isEmptyI18n = (v: I18nText) => !v.fr && !v.ar && !v.en;
