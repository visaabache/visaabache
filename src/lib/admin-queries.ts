import "server-only";
import type { Prisma, StatusKind } from "@prisma/client";

export type AppFilters = { q?: string; status?: string; kind?: string; overdue?: string; docs?: string; archived?: string; drafts?: string; country?: string };

export function applicationWhere(f: AppFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {
    isDraft: f.drafts === "1",
    ...(f.archived === "1" ? {} : { archivedAt: null }),
  };
  const and: Prisma.ApplicationWhereInput[] = [];
  if (f.q) {
    const q = f.q.trim();
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { passportNumber: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.status) and.push({ status: { key: f.status } });
  if (f.kind && ["OPEN", "WAITING_CUSTOMER", "COMPLETED", "CANCELLED"].includes(f.kind)) and.push({ status: { kind: f.kind as StatusKind } });
  if (f.overdue === "1") and.push({ deadline: { lt: new Date() }, status: { kind: { in: ["OPEN", "WAITING_CUSTOMER"] } } });
  if (f.docs === "pending") and.push({ documents: { some: { status: "PENDING_REVIEW", direction: "CUSTOMER_UPLOAD" } } });
  if (f.country) and.push({ country: { slug: f.country } });
  if (and.length) where.AND = and;
  return where;
}

export function csvEscape(v: unknown) {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]) {
  return "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}
