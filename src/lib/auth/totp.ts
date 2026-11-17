import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import qrcode from "qrcode-generator";
import { decryptBuffer, encryptBuffer } from "../storage/crypto";

/*
 * Time-based one-time codes (RFC 6238: HMAC-SHA1, 6 digits, 30 s), as used by Google Authenticator,
 * Microsoft Authenticator, Authy… Secrets are stored encrypted with DOCUMENT_ENCRYPTION_KEY.
 */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD = 30;
const ISSUER = "VISA ABACHE";

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string) {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function newTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function totpCode(secret: string, step: number) {
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  msg.writeUInt32BE(step >>> 0, 4);
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

export function currentStep(now = Date.now()) {
  return Math.floor(now / 1000 / PERIOD);
}

/**
 * Checks a code against the current time step ±1 (clock drift). Returns the matched step, or null.
 * Steps at or before `lastStep` are refused so an intercepted code cannot be used twice.
 */
export function verifyTotp(secret: string, code: string, lastStep?: number | null, now = Date.now()): number | null {
  const c = String(code || "").replace(/\D/g, "");
  if (c.length !== 6) return null;
  const step = currentStep(now);
  for (const s of [step - 1, step, step + 1]) {
    if (lastStep != null && s <= lastStep) continue;
    if (timingSafeEqual(Buffer.from(totpCode(secret, s)), Buffer.from(c))) return s;
  }
  return null;
}

export function sealSecret(secret: string) {
  return encryptBuffer(Buffer.from(secret, "utf8")).toString("base64");
}

export function openSecret(sealed: string) {
  return decryptBuffer(Buffer.from(sealed, "base64")).toString("utf8");
}

export function otpauthUri(email: string, secret: string) {
  const label = encodeURIComponent(`${ISSUER}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=${PERIOD}`;
}

/** QR code of the otpauth URI as an inline SVG (rendered server-side, nothing sent to third parties). */
export function qrSvg(text: string) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true });
}
