import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_DIR } from "@/lib/storage";

export const runtime = "nodejs";

/** Serves images uploaded to local storage (used when Supabase Storage is not configured). */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = path.normalize((await params).path.join("/"));
  if (rel.startsWith("..") || path.isAbsolute(rel) || !/\.(webp|jpg|jpeg|png|avif)$/i.test(rel)) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(LOCAL_DIR, rel));
    const ext = path.extname(rel).slice(1).toLowerCase();
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": ext === "jpg" ? "image/jpeg" : `image/${ext}`, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
