import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Right of access (Law 09-08): exports the customer's personal data as JSON (documents are listed, not embedded). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true, firstName: true, lastName: true, phone: true, city: true, address: true, locale: true, createdAt: true, lastLoginAt: true,
      marketingOptIn: true, whatsappOptIn: true,
      applications: {
        select: {
          reference: true, createdAt: true, submittedAt: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, nationality: true,
          passportNumber: true, passportExpiry: true, city: true, purpose: true, departureDate: true, returnDate: true, travelers: true, answers: true,
          country: { select: { slug: true } }, status: { select: { key: true } },
          documents: { select: { label: true, originalName: true, mimeType: true, size: true, createdAt: true } },
          history: { select: { createdAt: true, note: true, toStatus: { select: { key: true } } } },
        },
      },
      invoices: { select: { number: true, issueDate: true, total: true, amountPaid: true, status: true } },
      payments: { select: { reference: true, amount: true, method: true, status: true, createdAt: true } },
      consents: { select: { type: true, version: true, granted: true, context: true, createdAt: true } },
      tickets: { select: { subject: true, createdAt: true, messages: { select: { body: true, fromStaff: true, createdAt: true } } } },
    },
  });
  await audit(user.id, "privacy.data_exported", "User", user.id);
  await prisma.dataRequest.create({ data: { userId: user.id, email: user.email, type: "ACCESS_EXPORT", status: "COMPLETED", completedAt: new Date(), response: "Self-service export" } });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), controller: "VISA ABACHE", data }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="visa-abache-my-data.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
