import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getRequestMeta } from "./request";

export async function audit(
  actorId: string | null | undefined,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue,
) {
  try {
    let ip: string | undefined;
    try {
      ip = (await getRequestMeta()).ip;
    } catch {
      ip = undefined; // outside of a request (cron/scripts)
    }
    await prisma.auditLog.create({
      data: { actorId: actorId ?? null, action, entityType, entityId, metadata, ip },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}
