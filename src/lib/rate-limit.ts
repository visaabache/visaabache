import { prisma } from "./db";

/**
 * Fixed-window rate limiter backed by PostgreSQL (works on serverless and multi-instance deployments).
 * Returns true when the action is allowed. With `peek`, only checks the current count without adding to it
 * (used for site-wide counters that are only increased on failures).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number, peek = false): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  try {
    if (peek) {
      const row = await prisma.rateLimit.findUnique({ where: { key }, select: { count: true, resetAt: true } });
      return !row || row.resetAt < now || row.count < limit;
    }
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    return (rows[0]?.count ?? 1) <= limit;
  } catch (e) {
    console.error("[rate-limit]", e);
    return true; // fail open rather than lock customers out if the table is unavailable
  }
}
