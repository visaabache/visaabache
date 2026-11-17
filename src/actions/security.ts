"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser, hashToken, SESSION_COOKIE } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/permissions";
import { verifyPassword } from "@/lib/auth/password";
import { openSecret, verifyTotp } from "@/lib/auth/totp";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import type { ActionState } from "@/lib/action-state";

async function staff() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) throw new Error("FORBIDDEN");
  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

/** Confirms the pending secret shown on the security page with a first code, then turns 2FA on. */
export async function enableTotpAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await staff();
  if (user.totpEnabledAt) return { ok: true, message: t.security.enabled };
  if (!(await rateLimit(`totp-setup:${user.id}`, 10, 900))) return { error: t.common.tooManyRequests };
  if (!user.totpSecret) return { error: t.security.totpInvalid };
  const step = verifyTotp(openSecret(user.totpSecret), String(fd.get("code") || ""));
  if (step === null) return { error: t.security.totpInvalid };
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabledAt: new Date(), totpLastStep: step } });
  await audit(user.id, "auth.2fa_enabled", "User", user.id);
  return { ok: true, message: t.security.enabled };
}

export async function disableTotpAction(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await staff();
  if (!(await rateLimit(`totp-off:${user.id}`, 5, 900))) return { error: t.common.tooManyRequests };
  if (!(await verifyPassword(String(fd.get("password") || ""), user.passwordHash))) return { error: t.security.wrongPassword };
  const step = user.totpSecret ? verifyTotp(openSecret(user.totpSecret), String(fd.get("code") || ""), user.totpLastStep) : null;
  if (step === null) return { error: t.security.totpInvalid };
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabledAt: null, totpSecret: null, totpLastStep: null } });
  await audit(user.id, "auth.2fa_disabled", "User", user.id);
  return { ok: true, message: t.security.disabled };
}

export async function signOutOtherSessionsAction(localeRaw: string, _prev: ActionState): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await staff();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const { count } = await prisma.session.deleteMany({ where: { userId: user.id, ...(token ? { NOT: { tokenHash: hashToken(token) } } : {}) } });
  await audit(user.id, "auth.signed_out_other_sessions", "User", user.id, { count });
  return { ok: true, message: t.security.signedOutOthers };
}
