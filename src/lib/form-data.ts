import type { Prisma } from "@prisma/client";
import { locales } from "./i18n/config";

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => str(fd, k) || null;
export const bool = (fd: FormData, k: string) => ["on", "true", "1"].includes(String(fd.get(k) ?? ""));
export const int = (fd: FormData, k: string, d = 0) => {
  const n = parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : d;
};
export const money = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
export const date = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
export const csv = (fd: FormData, k: string) =>
  str(fd, k)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Reads `${k}.fr`, `${k}.ar`, `${k}.en` into a localized JSON object (null when all empty). */
export function loc(fd: FormData, k: string): Prisma.InputJsonValue | null {
  const out: Record<string, string> = {};
  for (const l of locales) {
    const v = str(fd, `${k}.${l}`);
    if (v) out[l] = v;
  }
  return Object.keys(out).length ? out : null;
}

/** Same as loc() but each locale value is split into lines (features lists). */
export function locList(fd: FormData, k: string): Prisma.InputJsonValue | null {
  const out: Record<string, string[]> = {};
  for (const l of locales) {
    const lines = str(fd, `${k}.${l}`)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length) out[l] = lines;
  }
  return Object.keys(out).length ? out : null;
}

export function jsonOrDbNull<T>(v: T | null) {
  return v === null ? ("DbNull" as const) : v;
}
