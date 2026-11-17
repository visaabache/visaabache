/* eslint-disable no-console */
/**
 * Turns off two-step verification for one staff account (lost or replaced phone) and signs it out everywhere.
 *   DATABASE_URL=… npm run admin:reset-2fa -- staff@example.ma
 * The person then signs in with their password and enables 2FA again from Administration → Security.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = /\.neon\.tech/.test(process.env.DATABASE_URL || "")
  ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) })
  : new PrismaClient();

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run admin:reset-2fa -- staff@example.ma");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("No account with this email.");
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.auditLog.create({ data: { actorId: null, action: "auth.2fa_reset_by_script", entityType: "User", entityId: user.id } });
  console.log(`Two-step verification turned off for ${email}; all sessions signed out.`);
}

main().finally(() => prisma.$disconnect());
