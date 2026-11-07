/**
 * Applies Prisma migrations to a Neon database over HTTPS (Neon serverless driver).
 * Useful where outbound TCP 5432 is blocked (CI sandboxes, some corporate networks).
 * Records each migration in `_prisma_migrations` exactly like `prisma migrate deploy`,
 * so both tools can be used interchangeably afterwards.
 *
 *   DATABASE_URL=postgresql://…neon.tech/neondb?sslmode=require node scripts/neon-migrate.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";

// Query the endpoint host directly (the default regional "api." host may not be reachable everywhere).
neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const sql = neon(url);
const dir = join(process.cwd(), "prisma", "migrations");

await sql.query(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
)`);

const applied = new Set((await sql.query(`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`)).map((r) => r.migration_name));

for (const name of readdirSync(dir).filter((d) => /^\d+_/.test(d)).sort()) {
  if (applied.has(name)) {
    console.log(`• ${name} (already applied)`);
    continue;
  }
  const content = readFileSync(join(dir, name, "migration.sql"), "utf8");
  // Prisma-generated migrations contain plain DDL statements terminated by ";" at line end.
  const statements = content
    .split(/;\s*\n/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  const id = randomUUID();
  const checksum = createHash("sha256").update(content).digest("hex");
  await sql.query(`INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at) VALUES ($1, $2, $3, now())`, [id, checksum, name]);
  // Run all statements of a migration in one transaction.
  await sql.transaction(statements.map((s) => sql.query(s)));
  await sql.query(`UPDATE "_prisma_migrations" SET finished_at = now(), applied_steps_count = 1 WHERE id = $1`, [id]);
  console.log(`✓ ${name} (${statements.length} statements)`);
}
console.log("Migrations up to date.");
