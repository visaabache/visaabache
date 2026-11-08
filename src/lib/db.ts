import { PrismaClient } from "@prisma/client";
import { PrismaNeon, PrismaNeonHTTP } from "@prisma/adapter-neon";

/**
 * Database access.
 * - Regular Node.js hosting (Docker/VPS/local): one shared PrismaClient (native engine).
 * - Cloudflare Workers + Neon: ONE PrismaClient per Worker instance with a hybrid driver adapter:
 *   · queries go over Neon's HTTP driver — plain fetch() calls, safe to reuse across requests;
 *   · transactions (explicit `$transaction(async (tx) => …)` and the implicit ones Prisma opens for nested
 *     writes) get a short-lived WebSocket connection opened inside the current request and closed on
 *     commit/rollback, because sockets cannot be shared between requests on Workers.
 *   Creating a PrismaClient is expensive on Workers (the query engine loads and parses the whole schema),
 *   so reusing one per instance instead of one per request saves hundreds of ms of CPU per page.
 * - Node.js scripts against Neon (DB_DRIVER=neon): the WebSocket pool adapter, shared per process.
 *
 * Always use the callback form of $transaction.
 */

function onWorkers() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function wantsNeonAdapter() {
  return process.env.DB_DRIVER === "neon" || /\.neon\.tech/.test(process.env.DATABASE_URL || "");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Adapter = {
  provider: string;
  adapterName: string;
  queryRaw(q: any): Promise<any>;
  executeRaw(q: any): Promise<any>;
  executeScript(s: string): Promise<void>;
  startTransaction(isolationLevel?: any): Promise<any>;
  getConnectionInfo?(): any;
  dispose(): Promise<void>;
};

function hybridNeonAdapter(url: string) {
  const http = new PrismaNeonHTTP(url, {});
  return {
    provider: "postgres" as const,
    adapterName: http.adapterName,
    async connect() {
      const base = (await http.connect()) as unknown as Adapter;
      return {
        provider: base.provider,
        adapterName: base.adapterName,
        queryRaw: (q: any) => base.queryRaw(q),
        executeRaw: (q: any) => base.executeRaw(q),
        executeScript: (s: string) => base.executeScript(s),
        // Optional in the adapter contract: only expose it when the HTTP adapter implements it.
        ...(base.getConnectionInfo ? { getConnectionInfo: () => base.getConnectionInfo!() } : {}),
        dispose: () => base.dispose(),
        async startTransaction(isolationLevel?: any) {
          const ws = (await new PrismaNeon({ connectionString: url }).connect()) as unknown as Adapter;
          const close = () => ws.dispose().catch(() => {});
          let tx: any;
          try {
            tx = await ws.startTransaction(isolationLevel);
          } catch (e) {
            close();
            throw e;
          }
          return {
            options: tx.options,
            provider: tx.provider,
            adapterName: tx.adapterName,
            queryRaw: (q: any) => tx.queryRaw(q),
            executeRaw: (q: any) => tx.executeRaw(q),
            commit: async () => { try { await tx.commit(); } finally { close(); } },
            rollback: async () => { try { await tx.rollback(); } finally { close(); } },
          };
        },
      };
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function createClient() {
  const log: ("warn" | "error")[] = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
  const url = process.env.DATABASE_URL!;
  if (onWorkers()) return new PrismaClient({ adapter: hybridNeonAdapter(url) as unknown as PrismaNeon, log });
  if (wantsNeonAdapter()) return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }), log });
  return new PrismaClient({ log });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    globalForPrisma.prisma ??= createClient();
    const client = globalForPrisma.prisma;
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
