/**
 * Creates or promotes an owner account.
 *   npm run admin:create -- you@example.com "Your Name"
 * The password is read from ADMIN_PASSWORD, or asked interactively (not echoed).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

async function ask(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = process.stdout as unknown as { write: (s: string) => boolean };
  const original = out.write.bind(out);
  return new Promise((resolve) => {
    rl.question(q, (a) => {
      out.write = original;
      original("\n");
      rl.close();
      resolve(a);
    });
    out.write = (s: string) => (s.includes(q) ? original(s) : true);
  });
}

(async () => {
  const [email, ...nameParts] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: npm run admin:create -- email@example.com "Full name"');
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD || (await ask("Password (10+ characters): "));
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);
  const name = nameParts.join(" ") || "Owner";
  await prisma.user.upsert({ where: { email: email.toLowerCase() }, create: { email: email.toLowerCase(), name, role: "ADMIN", passwordHash }, update: { role: "ADMIN", passwordHash, isActive: true } });
  console.log(`✓ ${email} can now sign in at /admin`);
  await prisma.$disconnect();
})();
