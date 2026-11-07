/* eslint-disable no-console */
/**
 * Creates (or promotes) the owner account.
 *   npm run admin:create -- owner@example.ma "Prénom" "Nom"
 * The password is read from ADMIN_PASSWORD or prompted interactively (never passed on the command line).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { createInterface } from "node:readline/promises";

// Neon (serverless Postgres) is reached over its HTTPS/WebSocket driver; other databases over TCP.
const prisma = /\.neon\.tech/.test(process.env.DATABASE_URL || "")
  ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) })
  : new PrismaClient();

async function main() {
  const [email, firstName = "Admin", lastName = "VISA ABACHE"] = process.argv.slice(2);
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('Usage: npm run admin:create -- owner@example.ma "First" "Last"');
    process.exit(1);
  }
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (min. 10 chars, letters + digits): ");
    rl.close();
  }
  if (!password || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error("Password too weak.");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "OWNER", isActive: true, passwordHash },
    create: { email: email.toLowerCase(), firstName, lastName, role: "OWNER", passwordHash, locale: "fr" },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log(`✓ Owner account ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
