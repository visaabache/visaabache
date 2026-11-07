import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readStoredFile } from "@/lib/storage";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Streams a decrypted document to its owner or to authorised staff. Every staff access is audited. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const isOwner = doc.ownerId === user.id;
  const isStaff = can(user.role, "applications.view");
  if (!isOwner && !isStaff) return new NextResponse("Forbidden", { status: 403 });
  const data = await readStoredFile(doc.storageKey, doc.encrypted);
  if (isStaff && !isOwner) await audit(user.id, "document.accessed", "Document", doc.id, { applicationId: doc.applicationId });
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
