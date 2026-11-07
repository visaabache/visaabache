import { randomInt } from "node:crypto";

// Unambiguous alphabet (no 0/O, 1/I/L)
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function randomCode(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Application reference, e.g. VA-26-7KQ4MZ */
export function applicationReference(date = new Date()) {
  return `VA-${String(date.getFullYear()).slice(2)}-${randomCode(6)}`;
}

/** Payment reference, e.g. PAY-26-9XH2KD7Q */
export function paymentReference(date = new Date()) {
  return `PAY-${String(date.getFullYear()).slice(2)}-${randomCode(8)}`;
}

export function isValidReference(ref: string) {
  return /^VA-\d{2}-[2-9A-HJKMNP-Z]{6}$/.test(ref);
}
