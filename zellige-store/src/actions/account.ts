"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { hashPassword, verifyPasswordOrDummy } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, isStaff } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail, normalizePhone } from "@/lib/utils";
import type { FormState } from "./public";

/** Only same-site relative paths are accepted as a post-login destination. */
function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = String(v || "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const locale = asLocale(form.get("locale"));
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 900_000) || !rateLimit(`login:${email}`, 8, 900_000)) return { error: "rate" };
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPasswordOrDummy(password, user?.passwordHash);
  if (!user || !ok || !user.isActive) return { error: "invalid" };
  await createSession(user);
  redirect(safeNext(form.get("next"), `/${locale}/account`));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const locale = asLocale(form.get("locale"));
  const name = String(form.get("name") || "").trim().slice(0, 100);
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = normalizePhone(String(form.get("phone") || "")).slice(0, 20);
  const password = String(form.get("password") || "");
  if (!name || !isEmail(email) || password.length < 8 || password.length > 200) return { error: "invalid" };
  if (!rateLimit(`register:${await clientIp()}`, 5, 3600_000)) return { error: "rate" };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return { error: "exists" };
  const user = await prisma.user.create({ data: { name, email, phone: phone || null, locale, passwordHash: await hashPassword(password) } });
  // Attach earlier guest orders placed with this email.
  await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  await createSession(user);
  redirect(safeNext(form.get("next"), `/${locale}/account`));
}

export async function logout(form: FormData) {
  const locale = asLocale(form.get("locale"));
  await destroySession();
  redirect(`/${locale}`);
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" };
  const name = String(form.get("name") || "").trim().slice(0, 100);
  if (!name) return { error: "invalid" };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: normalizePhone(String(form.get("phone") || "")).slice(0, 20) || null,
      city: String(form.get("city") || "").trim().slice(0, 80) || null,
      address: String(form.get("address") || "").trim().slice(0, 300) || null,
    },
  });
  return { ok: true };
}

export async function adminLogin(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = await clientIp();
  if (!rateLimit(`admin-login:${ip}`, 8, 900_000) || !rateLimit(`admin-login:${email}`, 6, 900_000)) return { error: "Too many attempts. Wait 15 minutes." };
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPasswordOrDummy(password, user?.passwordHash);
  if (!user || !ok || !user.isActive || !isStaff(user.role)) return { error: "Incorrect email or password." };
  await createSession(user);
  redirect(safeNext(form.get("next"), "/admin"));
}

export async function adminLogout() {
  await destroySession();
  redirect("/admin/login");
}
