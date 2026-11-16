import bcrypt from "bcryptjs";

const COST = 12;

export const hashPassword = (pw: string) => bcrypt.hash(pw, COST);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

// Hash of a random discarded secret: makes unknown-email logins take as long as real ones.
const DUMMY = "$2b$12$TYv0pBu1lrwqc2rHpbX6sunYF6hfSK15BG4b/TTvX/F8n8OCVaFbi";

export async function verifyPasswordOrDummy(pw: string, hash: string | null | undefined) {
  if (hash && hash.startsWith("$2")) return verifyPassword(pw, hash);
  await verifyPassword(pw, DUMMY);
  return false;
}
