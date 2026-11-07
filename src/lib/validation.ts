import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(160);
export const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(25)
  .regex(/^[+\d][\d\s().-]{6,}$/);
export const nameSchema = z.string().trim().min(1).max(80);
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));
export const optionalDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true" || v === "1");

export function formToObject(fd: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}

export function safeNext(next: unknown, fallback: string) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export const LEGAL_VERSION = "2026-11";
