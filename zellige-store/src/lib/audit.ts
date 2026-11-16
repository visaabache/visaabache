import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

/** Records who changed what in the admin. Never throws. */
export async function audit(actor: string, action: string, target?: string, meta?: Prisma.InputJsonValue) {
  await prisma.auditLog.create({ data: { actor, action, target, meta } }).catch(() => {});
}
