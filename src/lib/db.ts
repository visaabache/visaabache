import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Database access.
 * - Regular Node.js hosting (Docker/VPS/local): one shared PrismaClient (native engine).
 * - Neon Postgres (DATABASE_URL on *.neon.tech) or Cloudflare Workers: the Neon serverless driver adapter.
 *   On Workers, network sockets cannot be shared between requests, so one client is created per request
 *   (keyed on the request's ExecutionContext provided by OpenNext).
 */

const CF_CONTEXT = Symbol.for("__cloudflare-context__");

function onWorkers() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function wantsNeonAdapter() {
  return onWorkers() || process.env.DB_DRIVER === "neon" || /\.neon\.tech/.test(process.env.DATABASE_URL || "");
}

function createClient() {
  const log: ("warn" | "error")[] = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
  if (wantsNeonAdapter()) {
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }), log });
  }
  return new PrismaClient({ log });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const perRequest = new WeakMap<object, PrismaClient>();

function currentClient(): PrismaClient {
  if (onWorkers()) {
    const ctx = (globalThis as Record<symbol, { ctx?: object } | undefined>)[CF_CONTEXT]?.ctx;
    if (ctx) {
      let client = perRequest.get(ctx);
      if (!client) {
        client = createClient();
        perRequest.set(ctx, client);
      }
      return client;
    }
    return createClient();
  }
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = currentClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
