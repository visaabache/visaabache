import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readStoredFile } from "@/lib/storage";
import { createZip } from "@/lib/zip";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user.role, "applications.view")) return new NextResponse("Forbidden", { status: 403 });
  const app = await prisma.application.findUnique({ where: { id }, include: { documents: { orderBy: { createdAt: "asc" } } } });
  if (!app) return new NextResponse("Not found", { status: 404 });
  const files = [];
  for (const d of app.documents) {
    const ext = d.originalName.includes(".") ? "" : `.${d.mimeType.split("/")[1]}`;
    files.push({ name: `${d.label.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80)} - ${d.originalName}${ext}`, data: await readStoredFile(d.storageKey, d.encrypted) });
  }
  const summary = [
    `Reference: ${app.reference}`,
    `Applicant: ${app.firstName} ${app.lastName}`,
    `Email: ${app.email}`,
    `Phone: ${app.phone}`,
    `Passport: ${app.passportNumber || "-"} (exp. ${app.passportExpiry?.toISOString().slice(0, 10) || "-"})`,
    `Travel: ${app.departureDate?.toISOString().slice(0, 10) || "-"} -> ${app.returnDate?.toISOString().slice(0, 10) || "-"}`,
    `Answers: ${JSON.stringify(app.answers)}`,
  ].join("\n");
  files.unshift({ name: "00-summary.txt", data: Buffer.from(summary, "utf8") });
  await audit(user.id, "application.downloaded_zip", "Application", app.id, { files: files.length });
  return new NextResponse(new Uint8Array(createZip(files)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${app.reference}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
