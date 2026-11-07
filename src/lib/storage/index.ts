import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { decryptBuffer, encryptBuffer, sha256 } from "./crypto";

export interface StorageDriver {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

class LocalDriver implements StorageDriver {
  private root = resolve(process.env.STORAGE_LOCAL_DIR || "./storage");
  private path(key: string) {
    const p = resolve(join(this.root, key));
    if (!p.startsWith(this.root)) throw new Error("Invalid storage key");
    return p;
  }
  async put(key: string, data: Buffer) {
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true, mode: 0o700 });
    await writeFile(p, data, { mode: 0o600 });
  }
  async get(key: string) {
    return readFile(this.path(key));
  }
  async remove(key: string) {
    await unlink(this.path(key)).catch(() => {});
  }
}

// Loaded at runtime only (kept out of serverless bundles, e.g. Cloudflare Workers size limits).
function loadS3(): Promise<typeof import("@aws-sdk/client-s3")> {
  // Runtime-computed specifier: bundlers cannot follow it, so the SDK is only loaded where it is installed and used.
  const specifier = process.env.S3_SDK_MODULE || "@aws-sdk/client-s3";
  return import(/* webpackIgnore: true */ specifier);
}

class S3Driver implements StorageDriver {
  // Lazily imported so local installs do not load the AWS SDK.
  private async client() {
    const { S3Client } = await loadS3();
    return new S3Client({
      region: process.env.S3_REGION || "eu-west-3",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
    });
  }
  private bucket = process.env.S3_BUCKET || "visa-abache-documents";
  async put(key: string, data: Buffer) {
    const { PutObjectCommand } = await loadS3();
    await (await this.client()).send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: "application/octet-stream" }),
    );
  }
  async get(key: string) {
    const { GetObjectCommand } = await loadS3();
    const res = await (await this.client()).send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }
  async remove(key: string) {
    const { DeleteObjectCommand } = await loadS3();
    await (await this.client()).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/** Stores encrypted blobs in PostgreSQL (StoredFile table). Suited to small volumes / serverless hosts. */
class DbDriver implements StorageDriver {
  async put(key: string, data: Buffer) {
    const { prisma } = await import("../db");
    await prisma.storedFile.upsert({ where: { key }, create: { key, data: new Uint8Array(data) }, update: { data: new Uint8Array(data) } });
  }
  async get(key: string) {
    const { prisma } = await import("../db");
    const row = await prisma.storedFile.findUnique({ where: { key } });
    if (!row) throw new Error("File not found");
    return Buffer.from(row.data);
  }
  async remove(key: string) {
    const { prisma } = await import("../db");
    await prisma.storedFile.deleteMany({ where: { key } });
  }
}

let driver: StorageDriver | null = null;
export function storage(): StorageDriver {
  if (!driver) {
    const d = process.env.STORAGE_DRIVER;
    driver = d === "s3" ? new S3Driver() : d === "db" ? new DbDriver() : new LocalDriver();
  }
  return driver;
}

// Default 10 MB. On hosts with request-body limits (e.g. Vercel ≈ 4.5 MB) set UPLOAD_MAX_MB=4.
export const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.UPLOAD_MAX_MB) || 10) * 1024 * 1024;

export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Detects the real file type from magic bytes (never trust the browser-provided MIME type). */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

export type StoredFile = { storageKey: string; mimeType: string; size: number; sha256: string; originalName: string };

export class UploadError extends Error {
  constructor(public code: "too_large" | "bad_type" | "empty") {
    super(code);
  }
}

export function safeFileName(name: string) {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "document";
}

/** Validates, encrypts and stores an uploaded file. */
export async function storeUpload(file: File, folder: string): Promise<StoredFile> {
  if (!file || file.size === 0) throw new UploadError("empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("too_large");
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime || !ALLOWED_TYPES[mime]) throw new UploadError("bad_type");
  const storageKey = `${folder}/${new Date().getFullYear()}/${randomBytes(16).toString("hex")}.${ALLOWED_TYPES[mime]}.enc`;
  await storage().put(storageKey, encryptBuffer(buf));
  return { storageKey, mimeType: mime, size: buf.length, sha256: sha256(buf), originalName: safeFileName(file.name) };
}

export async function readStoredFile(storageKey: string, encrypted = true) {
  const data = await storage().get(storageKey);
  return encrypted ? decryptBuffer(data) : data;
}
