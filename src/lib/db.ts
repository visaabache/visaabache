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

function client() {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/*
 * Watchdog (Workers only). When Cloudflare cuts a request off (CPU limit), work it started inside the shared client
 * can stay pending forever, and later requests waiting on it would hang. Every call is raced against a timer: on
 * timeout the shared client is dropped, so the next request starts with a fresh one instead of hanging too.
 */
const WATCHDOG_MS = 12_000;

function guarded<T>(work: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      globalForPrisma.prisma = undefined;
      reject(new Error("Database request timed out; connection reset"));
    }, WATCHDOG_MS);
    work().then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function guardFn(fn: (...a: unknown[]) => unknown) {
  return (...args: unknown[]) => {
    const r = fn(...args);
    return r && typeof (r as Promise<unknown>).then === "function" ? guarded(() => r as Promise<unknown>) : r;
  };
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop, c);
    if (!onWorkers()) return typeof value === "function" ? value.bind(c) : value;
    if (typeof value === "function") return guardFn(value.bind(c));
    if (value && typeof value === "object" && typeof prop === "string" && !prop.startsWith("$") && !prop.startsWith("_")) {
      // Model delegate (prisma.user, prisma.application, …)
      return new Proxy(value as object, {
        get(target, method) {
          const m = Reflect.get(target, method, target);
          return typeof m === "function" ? guardFn(m.bind(target)) : m;
        },
      });
    }
    return value;
  },
});
