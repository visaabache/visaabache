import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// File format: [ "VA1" (3 bytes) | IV (12 bytes) | AUTH TAG (16 bytes) | CIPHERTEXT ]
const MAGIC = Buffer.from("VA1");

function key(): Buffer {
  const raw = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") throw new Error("DOCUMENT_ENCRYPTION_KEY is required in production");
    return createHash("sha256").update("visa-abache-dev-only-key").digest();
  }
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("DOCUMENT_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return k;
}

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), enc]);
}

export function decryptBuffer(data: Buffer): Buffer {
  if (data.subarray(0, 3).compare(MAGIC) !== 0) throw new Error("Unknown encrypted file format");
  const iv = data.subarray(3, 15);
  const tag = data.subarray(15, 31);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data.subarray(31)), decipher.final()]);
}

export function sha256(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}
