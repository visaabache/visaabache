import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { prisma } from "../db";

export const SESSION_COOKIE = "dz_session";
const CUSTOMER_TTL = 30 * 86400_000;
const STAFF_TTL = 12 * 3600_000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ characters)");
    return "dev-only-insecure-session-secret-000000000000";
  }
  return s;
}

export const hashToken = (token: string) => createHmac("sha256", secret()).update(token).digest("hex");
export const newToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const isStaff = (role: Role) => role === "ADMIN" || role === "STAFF";

export async function createSession(user: { id: string; role: Role }) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + (isStaff(user.role) ? STAFF_TTL : CUSTOMER_TTL));
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt } });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  // Opportunistic cleanup of expired sessions.
  prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  (await cookies()).set(SESSION_COOKIE, token, {
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

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  locale: string;
  country: string | null;
  city: string | null;
  address: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: { id: true, email: true, name: true, phone: true, role: true, locale: true, country: true, city: true, address: true, isActive: true },
      },
    },
  });
  if (!s || s.expiresAt < new Date() || !s.user.isActive) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isActive, ...user } = s.user;
  return user;
});

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect("/admin/login");
  return user;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertAdmin(opts: { ownerOnly?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) throw new Error("FORBIDDEN");
  if (opts.ownerOnly && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
