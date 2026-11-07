import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role, User } from "@prisma/client";
import { prisma } from "../db";
import { getRequestMeta } from "../request";
import { can, isStaffRole, type Permission } from "./permissions";
import type { Locale } from "../i18n/config";

export const SESSION_COOKIE = "va_session";
const CUSTOMER_TTL_DAYS = 14;
const STAFF_TTL_HOURS = 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ chars)");
    return "dev-only-insecure-session-secret-0000000000";
  }
  return s;
}

export function hashToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = newToken();
  const { ip, userAgent } = await getRequestMeta();
  const ttlMs = isStaffRole(user.role) ? STAFF_TTL_HOURS * 3600_000 : CUSTOMER_TTL_DAYS * 86400_000;
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt, ip, userAgent } });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export type CurrentUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "phone" | "role" | "locale" | "city" | "address" | "whatsappOptIn" | "marketingOptIn" | "createdAt"
>;

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true, role: true, locale: true,
          city: true, address: true, whatsappOptIn: true, marketingOptIn: true, createdAt: true, isActive: true,
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  // Touch at most every 10 minutes to limit writes.
  if (Date.now() - session.lastSeenAt.getTime() > 600_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isActive, ...user } = session.user;
  return user;
});

export async function requireUser(locale: Locale, next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireStaff(locale: Locale, permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (!isStaffRole(user.role)) redirect(`/${locale}/account`);
  if (permission && !can(user.role, permission)) redirect(`/${locale}/admin?denied=1`);
  return user;
}

/** For server actions: returns the user or throws (no redirect). */
export async function assertPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) throw new Error("FORBIDDEN");
  return user;
}

export function roleLabel(role: Role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
