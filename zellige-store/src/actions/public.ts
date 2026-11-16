"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail, normalizePhone } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";

export type FormState = { ok?: boolean; error?: string } | null;

export async function subscribeNewsletter(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const locale = asLocale(form.get("locale"));
  if (String(form.get("website") || "")) return { ok: true }; // honeypot
  if (!isEmail(email) || email.length > 200) return { error: "invalid" };
  if (!rateLimit(`nl:${await clientIp()}`, 10, 3600_000)) return { error: "rate" };
  await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email, locale }, update: {} });
  return { ok: true };
}

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  if (String(form.get("website") || "")) return { ok: true };
  const productId = String(form.get("productId") || "");
  const name = String(form.get("name") || "").trim().slice(0, 80);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 200);
  const title = String(form.get("title") || "").trim().slice(0, 120);
  const body = String(form.get("body") || "").trim().slice(0, 3000);
  const rating = Math.round(Number(form.get("rating")));
  const locale = asLocale(form.get("locale"));
  if (!productId || !name || body.length < 5 || !(rating >= 1 && rating <= 5) || (email && !isEmail(email))) return { error: "invalid" };
  if (!rateLimit(`review:${await clientIp()}`, 5, 3600_000)) return { error: "rate" };
  const product = await prisma.product.findFirst({ where: { id: productId, status: "PUBLISHED" }, select: { id: true } });
  if (!product) return { error: "invalid" };
  const user = await getCurrentUser();
  const contact = user?.email || email;
  const verifiedPurchase = contact
    ? !!(await prisma.orderItem.findFirst({ where: { productId, order: { email: contact, status: "DELIVERED" } }, select: { id: true } }))
    : false;
  await prisma.review.create({
    data: { productId, userId: user?.id, name, email: contact || null, title: title || null, body, rating, locale, verifiedPurchase },
  });
  revalidateTag(CATALOG_TAG);
  return { ok: true };
}

export async function trackOrder(_: FormState, form: FormData): Promise<FormState> {
  const locale = asLocale(form.get("locale"));
  const number = String(form.get("number") || "").trim().toUpperCase();
  const contact = String(form.get("contact") || "").trim().toLowerCase();
  if (!number || !contact) return { error: "invalid" };
  if (!rateLimit(`track:${await clientIp()}`, 20, 900_000)) return { error: "rate" };
  const order = await prisma.order.findUnique({ where: { number }, select: { number: true, accessToken: true, email: true, phone: true } });
  const phone = normalizePhone(contact);
  const match =
    order &&
    (order.email === contact || (phone.length >= 8 && normalizePhone(order.phone).replace(/^\+?212/, "0").endsWith(phone.replace(/^\+?212/, "0").slice(-9))));
  if (!match) return { error: "not_found" };
  redirect(`/${locale}/order/${order.number}?t=${order.accessToken}`);
}
