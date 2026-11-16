import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

/**
 * Image storage.
 * - Supabase Storage when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (public bucket SUPABASE_BUCKET, default "products").
 * - Otherwise the local ./storage/uploads folder, served by the /media route.
 * Every upload is re-encoded to WebP (max 2000 px): strips metadata, normalises orientation, keeps pages light.
 */

export const LOCAL_DIR = path.join(process.cwd(), "storage", "uploads");
const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set(["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"]);

const supabase = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key, bucket: process.env.SUPABASE_BUCKET || "products" } : null;
};

export type StoredImage = { url: string; width: number; height: number };

export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
  if (file.size > MAX_BYTES) throw new Error("Image larger than 15 MB");
  const input = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(input).metadata().catch(() => null);
  if (!meta?.format || !ACCEPTED.has(meta.format)) throw new Error("Unsupported image format");
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });
  const name = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomBytes(10).toString("hex")}.webp`;

  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sb.key}`, "Content-Type": "image/webp", "x-upsert": "false", "cache-control": "31536000" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
    return { url: `${sb.url}/storage/v1/object/public/${sb.bucket}/${name}`, width: info.width, height: info.height };
  }

  const target = path.join(LOCAL_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return { url: `/media/${name}`, width: info.width, height: info.height };
}

export async function deleteImage(url: string) {
  try {
    const sb = supabase();
    if (sb && url.startsWith(`${sb.url}/storage/v1/object/public/${sb.bucket}/`)) {
      const name = url.slice(`${sb.url}/storage/v1/object/public/${sb.bucket}/`.length);
      await fetch(`${sb.url}/storage/v1/object/${sb.bucket}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sb.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [name] }),
      });
    } else if (url.startsWith("/media/")) {
      const rel = path.normalize(url.slice("/media/".length));
      if (!rel.startsWith("..")) await unlink(path.join(LOCAL_DIR, rel));
    }
  } catch {
    // Missing files are not an error.
  }
}
