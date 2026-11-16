"use server";

import type { DiscountType, Role } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { CATALOG_TAG } from "@/lib/catalog";
import { DEFAULT_SETTINGS, type Settings, type SettingsKey } from "@/lib/settings";
import { bool, dateOrNull, float, i18nFrom, int, isEmptyI18n, list, money, str } from "@/lib/form";
import { isEmail } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";

/* ---------- Discount codes ---------- */

export async function saveDiscount(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const code = str(fd, "code", 40).toUpperCase().replace(/\s/g, "");
  const type = str(fd, "type") as DiscountType;
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { error: "Code: 3–40 characters, letters, digits, - or _." };
  if (!["PERCENT", "FIXED", "FREE_SHIPPING"].includes(type)) return { error: "Choose a type." };
  const raw = str(fd, "value");
  const value = type === "PERCENT" ? Math.round(Number(raw)) : type === "FIXED" ? money(fd, "value") ?? 0 : 0;
  if (type === "PERCENT" && !(value > 0 && value <= 100)) return { error: "Percent must be between 1 and 100." };
  if (type === "FIXED" && !(value > 0)) return { error: "Enter the amount in MAD." };
  const data = {
    code,
    type,
    value,
    minSubtotal: money(fd, "minSubtotal") ?? 0,
    maxUses: int(fd, "maxUses"),
    startsAt: dateOrNull(fd, "startsAt"),
    endsAt: dateOrNull(fd, "endsAt"),
    isActive: bool(fd, "isActive"),
  };
  const clash = await prisma.discountCode.findFirst({ where: { code, ...(id ? { id: { not: id } } : {}) } });
  if (clash) return { error: "This code already exists." };
  if (id) await prisma.discountCode.update({ where: { id }, data });
  else await prisma.discountCode.create({ data });
  await audit(admin.email, "discount.save", code);
  return { ok: true };
}

export async function deleteDiscount(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.discountCode.delete({ where: { id: str(fd, "id") } });
  return { ok: true };
}

/* ---------- Shipping ---------- */

export async function saveCity(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const name = i18nFrom(fd, "name", 80);
  if (isEmptyI18n(name)) return { error: "Enter the city name." };
  const fee = money(fd, "fee");
  if (fee === null) return { error: "Enter the delivery fee (MAD)." };
  const minDays = int(fd, "minDays") ?? 1;
  const maxDays = Math.max(minDays, int(fd, "maxDays") ?? minDays);
  const data = { name, region: str(fd, "region", 80) || null, fee, minDays, maxDays, codAvailable: bool(fd, "codAvailable"), isActive: bool(fd, "isActive"), sortOrder: int(fd, "sortOrder") ?? 0 };
  if (id) await prisma.shippingCity.update({ where: { id }, data });
  else await prisma.shippingCity.create({ data });
  return { ok: true };
}

export async function deleteCity(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.shippingCity.delete({ where: { id: str(fd, "id") } });
  return { ok: true };
}

export async function saveZone(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const name = i18nFrom(fd, "name", 80);
  const countries = list(str(fd, "countries", 2000)).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c) && c !== "MA");
  if (isEmptyI18n(name)) return { error: "Enter the zone name." };
  if (!countries.length) return { error: "List at least one country code (e.g. FR, BE, ES). Morocco is handled by cities." };
  const fee = money(fd, "fee");
  if (fee === null) return { error: "Enter the base fee (MAD)." };
  const minDays = int(fd, "minDays") ?? 5;
  const data = {
    name,
    countries,
    fee,
    perKgFee: money(fd, "perKgFee") ?? 0,
    freeOver: money(fd, "freeOver"),
    minDays,
    maxDays: Math.max(minDays, int(fd, "maxDays") ?? minDays),
    isActive: bool(fd, "isActive"),
    sortOrder: int(fd, "sortOrder") ?? 0,
  };
  if (id) await prisma.shippingZone.update({ where: { id }, data });
  else await prisma.shippingZone.create({ data });
  return { ok: true };
}

export async function deleteZone(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.shippingZone.delete({ where: { id: str(fd, "id") } });
  return { ok: true };
}

/* ---------- Reviews and testimonials ---------- */

async function recomputeRating(productId: string) {
  const agg = await prisma.review.aggregate({ where: { productId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  await prisma.product.update({ where: { id: productId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
}

export async function moderateReview(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const op = str(fd, "op");
  const r = await prisma.review.findUnique({ where: { id } });
  if (!r) return { error: "Not found" };
  if (op === "delete") await prisma.review.delete({ where: { id } });
  else await prisma.review.update({ where: { id }, data: { status: op === "approve" ? "APPROVED" : "REJECTED" } });
  await recomputeRating(r.productId);
  revalidateTag(CATALOG_TAG);
  return { ok: true };
}

export async function saveTestimonial(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const quote = i18nFrom(fd, "quote", 600);
  const name = str(fd, "name", 80);
  if (!name || isEmptyI18n(quote)) return { error: "Enter the customer's name and their words." };
  const data = { name, city: str(fd, "city", 80) || null, quote, rating: Math.min(5, Math.max(1, int(fd, "rating") ?? 5)), isPublished: bool(fd, "isPublished"), sortOrder: int(fd, "sortOrder") ?? 0 };
  if (id) await prisma.testimonial.update({ where: { id }, data });
  else await prisma.testimonial.create({ data });
  revalidateTag(CATALOG_TAG);
  return { ok: true };
}

export async function deleteTestimonial(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.testimonial.delete({ where: { id: str(fd, "id") } });
  revalidateTag(CATALOG_TAG);
  return { ok: true };
}

/* ---------- Newsletter ---------- */

export async function deleteSubscriber(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.newsletterSubscriber.delete({ where: { id: str(fd, "id") } });
  return { ok: true };
}

/* ---------- Content pages ---------- */

export async function savePage(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const slug = str(fd, "slug", 60).toLowerCase();
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return { error: "Slug: lowercase letters, digits and dashes." };
  const title = i18nFrom(fd, "title", 200);
  if (isEmptyI18n(title)) return { error: "Enter a title." };
  const body = i18nFrom(fd, "body", 100_000);
  await prisma.page.upsert({ where: { slug }, create: { slug, title, body }, update: { title, body } });
  await audit(admin.email, "page.save", slug);
  return { ok: true, redirect: str(fd, "isNew") ? `/admin/pages/${slug}` : undefined };
}

export async function deletePage(fd: FormData): Promise<ActionResult> {
  await assertAdmin({ ownerOnly: true });
  await prisma.page.delete({ where: { slug: str(fd, "slug") } });
  return { ok: true, redirect: "/admin/pages" };
}

/* ---------- Settings ---------- */

export async function saveSettings(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin({ ownerOnly: true });
  const section = str(fd, "section") as SettingsKey;
  if (!(section in DEFAULT_SETTINGS)) return { error: "Unknown section" };
  const defaults = DEFAULT_SETTINGS[section] as Record<string, unknown>;
  const value: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(defaults)) {
    if (typeof def === "boolean") value[k] = bool(fd, k);
    else if (typeof def === "number") value[k] = k === "lowStockThreshold" || k.endsWith("Days") ? int(fd, k) ?? def : money(fd, k) ?? 0;
    else value[k] = str(fd, k, 500);
  }
  if (section === "store") {
    if (!value.name) return { error: "Enter the shop name." };
    for (const k of ["instagram", "facebook", "tiktok", "pinterest"]) if (value[k] && !/^https:\/\//.test(String(value[k]))) return { error: `${k}: use a full https:// link.` };
    if (value.email && !isEmail(String(value.email))) return { error: "Invalid email." };
  }
  if (section === "inventory" && value.alertEmail && !isEmail(String(value.alertEmail))) return { error: "Invalid alert email." };
  await prisma.setting.upsert({ where: { key: section }, create: { key: section, value: value as Settings[typeof section] }, update: { value: value as Settings[typeof section] } });
  await audit(admin.email, "settings.save", section);
  revalidateTag("settings");
  return { ok: true };
}

export async function saveCurrency(fd: FormData): Promise<ActionResult> {
  await assertAdmin({ ownerOnly: true });
  const code = str(fd, "code", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return { error: "Use a 3-letter ISO code (EUR, USD…)." };
  const rate = code === "MAD" ? 1 : float(fd, "rateFromMad");
  if (!rate || rate <= 0) return { error: "Enter how much 1 MAD is worth in this currency (e.g. 0.092 for EUR)." };
  const data = { symbol: str(fd, "symbol", 6) || code, rateFromMad: rate, decimals: Math.min(3, Math.max(0, int(fd, "decimals") ?? 2)), isActive: code === "MAD" ? true : bool(fd, "isActive"), sortOrder: int(fd, "sortOrder") ?? 0 };
  await prisma.currency.upsert({ where: { code }, create: { code, ...data }, update: data });
  revalidateTag("currencies");
  return { ok: true };
}

export async function deleteCurrency(fd: FormData): Promise<ActionResult> {
  await assertAdmin({ ownerOnly: true });
  const code = str(fd, "code");
  if (code === "MAD") return { error: "MAD is the shop currency and cannot be removed." };
  await prisma.currency.delete({ where: { code } });
  revalidateTag("currencies");
  return { ok: true };
}

/* ---------- Team ---------- */

export async function saveStaff(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin({ ownerOnly: true });
  const email = str(fd, "email", 200).toLowerCase();
  const name = str(fd, "name", 100);
  const role = str(fd, "role") as Role;
  const password = String(fd.get("password") || "");
  if (!isEmail(email) || !name) return { error: "Enter a name and a valid email." };
  if (!["ADMIN", "STAFF"].includes(role)) return { error: "Choose a role." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing && password.length < 10) return { error: "Set a password of at least 10 characters." };
  if (password && password.length < 10) return { error: "Password: at least 10 characters." };
  if (existing && existing.id === admin.id && role !== "ADMIN") return { error: "You cannot remove your own owner role." };
  const passwordHash = password ? await hashPassword(password) : undefined;
  if (existing) await prisma.user.update({ where: { id: existing.id }, data: { name, role, isActive: true, ...(passwordHash ? { passwordHash } : {}) } });
  else await prisma.user.create({ data: { email, name, role, passwordHash: passwordHash! } });
  await audit(admin.email, "team.save", email, { role });
  return { ok: true };
}

export async function revokeStaff(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin({ ownerOnly: true });
  const id = str(fd, "id");
  if (id === admin.id) return { error: "You cannot revoke yourself." };
  await prisma.$transaction([prisma.user.update({ where: { id }, data: { role: "CUSTOMER" } }), prisma.session.deleteMany({ where: { userId: id } })]);
  await audit(admin.email, "team.revoke", id);
  return { ok: true };
}
