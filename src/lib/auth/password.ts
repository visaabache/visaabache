import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Minimum: 10 characters, at least one letter and one digit. */
export function isStrongPassword(pw: string) {
  return pw.length >= 10 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

// Fixed hash of a random, discarded secret (same cost as real hashes). A constant instead of a lazily computed
// shared promise: on Cloudflare Workers a promise started by one request can never be awaited by another.
const DUMMY_HASH = "$2b$12$TYv0pBu1lrwqc2rHpbX6sunYF6hfSK15BG4b/TTvX/F8n8OCVaFbi";

/** Verifies against a real hash, or a dummy one when the user does not exist (constant-time-ish, prevents enumeration). */
export async function verifyPasswordOrDummy(password: string, hash: string | null | undefined) {
  if (hash && hash.startsWith("$2")) return verifyPassword(password, hash);
  await verifyPassword(password, DUMMY_HASH);
  return false;
}
