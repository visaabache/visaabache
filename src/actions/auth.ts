"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { createSession, destroyAllSessions, destroySession, getCurrentUser, hashToken, newToken } from "@/lib/auth/session";
import { hashPassword, isStrongPassword, verifyPasswordOrDummy } from "@/lib/auth/password";
import { isStaffRole } from "@/lib/auth/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { checkbox, emailSchema, formToObject, LEGAL_VERSION, nameSchema, phoneSchema, safeNext } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function loginAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const data = formToObject(fd);
  const email = String(data.email || "").trim().toLowerCase();
  const { ip } = await getRequestMeta();
  if (!(await rateLimit(`login:${ip}`, 20, 900)) || !(await rateLimit(`login:${email}`, 8, 900))) {
    return { error: t.common.tooManyRequests, data: { email } };
  }
  const user = await prisma.user.findUnique({ where: { email } });
  // Always run bcrypt to avoid user enumeration through timing.
  const ok = await verifyPasswordOrDummy(String(data.password || ""), user?.passwordHash);
  if (!user || !ok || !user.isActive) {
    await audit(user?.id, "auth.login_failed", "User", user?.id, { email });
    return { error: t.auth.invalidCredentials, data: { email } };
  }
  // The admin sign-in page only lets staff in; a customer account gets the same generic error (no account probing).
  if (data.area === "admin" && !isStaffRole(user.role)) {
    await audit(user.id, "auth.admin_login_denied", "User", user.id);
    return { error: t.auth.invalidCredentials, data: { email } };
  }
  await createSession(user);
  await audit(user.id, "auth.login", "User", user.id);
  const fallback = isStaffRole(user.role) ? `/${locale}/admin` : `/${locale}/account`;
  redirect(safeNext(data.next, fallback));
}

const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: z.string().min(1).max(200),
    confirmPassword: z.string(),
    acceptTerms: checkbox,
    marketingOptIn: checkbox,
  });

export async function registerAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip, userAgent } = await getRequestMeta();
  if (!(await rateLimit(`register:${ip}`, 10, 3600))) return { error: t.common.tooManyRequests };
  const parsed = registerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: t.common.invalidForm, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  if (!isStrongPassword(d.password)) return { error: t.auth.weakPassword, fieldErrors: { password: [t.auth.weakPassword] } };
  if (d.password !== d.confirmPassword) return { error: t.auth.passwordMismatch, fieldErrors: { confirmPassword: [t.auth.passwordMismatch] } };
  if (!d.acceptTerms) return { error: t.apply.errors.consent, fieldErrors: { acceptTerms: [t.apply.errors.consent] } };
  if (await prisma.user.findUnique({ where: { email: d.email } })) return { error: t.auth.emailTaken, fieldErrors: { email: [t.auth.emailTaken] } };

  const user = await prisma.user.create({
    data: {
      email: d.email,
      passwordHash: await hashPassword(d.password),
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      locale,
      marketingOptIn: d.marketingOptIn,
      consents: {
        create: [
          { type: "TERMS", version: LEGAL_VERSION, granted: true, context: "register", ip, userAgent, email: d.email },
          { type: "PRIVACY_POLICY", version: LEGAL_VERSION, granted: true, context: "register", ip, userAgent, email: d.email },
          ...(d.marketingOptIn ? [{ type: "MARKETING" as const, version: LEGAL_VERSION, granted: true, context: "register", ip, userAgent, email: d.email }] : []),
        ],
      },
    },
  });
  await createSession(user);
  await notify({ key: "welcome", locale, userId: user.id, email: user.email, vars: { firstName: user.firstName }, link: `/${locale}/account` });
  redirect(safeNext(formToObject(fd).next, `/${locale}/account`));
}

export async function logoutAction(localeRaw: string) {
  await destroySession();
  redirect(`/${asLocale(localeRaw)}`);
}

export async function forgotPasswordAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip } = await getRequestMeta();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!(await rateLimit(`forgot:${ip}`, 5, 3600)) || !(await rateLimit(`forgot:${email}`, 3, 3600))) return { error: t.common.tooManyRequests };
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = newToken();
    await prisma.verificationToken.create({
      data: { tokenHash: hashToken(token), type: "PASSWORD_RESET", userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
    });
    await notify({
      key: "password_reset",
      locale: user.locale,
      email: user.email,
      vars: { firstName: user.firstName },
      link: `/${user.locale}/reset-password?token=${token}`,
      ctaLabel: t.auth.resetButton,
    });
  }
  return { ok: true, message: t.auth.forgotSent };
}

export async function resetPasswordAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const token = String(fd.get("token") || "");
  const password = String(fd.get("password") || "");
  if (!isStrongPassword(password)) return { error: t.auth.weakPassword };
  if (password !== String(fd.get("confirmPassword") || "")) return { error: t.auth.passwordMismatch };
  const rec = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date() || rec.type !== "PASSWORD_RESET") return { error: t.auth.resetInvalid };
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(password) } });
    await tx.verificationToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
  });
  await destroyAllSessions(rec.userId);
  await audit(rec.userId, "auth.password_reset", "User", rec.userId);
  return { ok: true, message: t.auth.resetDone, redirectTo: `/${locale}/login` };
}

export async function logoutEverywhereAction(localeRaw: string) {
  const user = await getCurrentUser();
  if (user) await destroyAllSessions(user.id);
  await destroySession();
  redirect(`/${asLocale(localeRaw)}/login`);
}
