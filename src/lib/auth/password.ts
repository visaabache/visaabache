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

let dummyHash: Promise<string> | null = null;
/** Verifies against a real hash, or a dummy one when the user does not exist (constant-time-ish, prevents enumeration). */
export async function verifyPasswordOrDummy(password: string, hash: string | null | undefined) {
  if (hash && hash.startsWith("$2")) return verifyPassword(password, hash);
  dummyHash ??= hashPassword("dummy-password-for-timing");
  await verifyPassword(password, await dummyHash);
  return false;
}
