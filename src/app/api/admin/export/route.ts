import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { applicationWhere, toCsv } from "@/lib/admin-queries";
import { tr } from "@/lib/i18n/localized";
import { toNumber } from "@/lib/utils";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** CSV exports for the admin: ?type=applications|payments|invoices (+ filters). */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const type = sp.type || "applications";
  const perm = type === "applications" ? "applications.view" : "finance.view";
  if (!user || !can(user.role, perm)) return new NextResponse("Forbidden", { status: 403 });
  let rows: unknown[][] = [];
  if (type === "applications") {
    const apps = await prisma.application.findMany({ where: applicationWhere(sp), include: { country: true, status: true, visaType: true, package: true }, orderBy: { createdAt: "desc" }, take: 5000 });
    rows = [["reference", "created", "submitted", "status", "destination", "visa_type", "first_name", "last_name", "email", "phone", "package", "total_mad", "deadline"]];
    for (const a of apps) rows.push([a.reference, a.createdAt, a.submittedAt, a.status.key, tr(a.country.name, "fr"), a.visaType ? tr(a.visaType.name, "fr") : "", a.firstName, a.lastName, a.email, a.phone, a.package ? tr(a.package.name, "fr") : "", toNumber(a.totalAmount), a.deadline]);
  } else if (type === "payments") {
    const from = sp.from ? new Date(sp.from) : new Date(0);
    const to = sp.to ? new Date(sp.to) : new Date();
    const pays = await prisma.payment.findMany({ where: { createdAt: { gte: from, lte: to } }, include: { user: true, invoice: true }, orderBy: { createdAt: "desc" } });
    rows = [["reference", "created", "confirmed", "status", "method", "provider", "amount_mad", "refunded_mad", "invoice", "customer", "email", "provider_txn"]];
    for (const p of pays) rows.push([p.reference, p.createdAt, p.confirmedAt, p.status, p.method, p.provider, toNumber(p.amount), toNumber(p.refundedAmount), p.invoice?.number, `${p.user.firstName} ${p.user.lastName}`, p.user.email, p.providerTxnId]);
  } else if (type === "invoices") {
    const invs = await prisma.invoice.findMany({ orderBy: { issueDate: "desc" } });
    rows = [["number", "issue_date", "due_date", "status", "customer", "email", "subtotal", "discount", "total", "paid", "balance"]];
    for (const i of invs) rows.push([i.number, i.issueDate, i.dueDate, i.status, i.billingName, i.billingEmail, toNumber(i.subtotal), toNumber(i.discount), toNumber(i.total), toNumber(i.amountPaid), toNumber(i.total) - toNumber(i.amountPaid)]);
  }
  await audit(user.id, "export.csv", type);
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="visa-abache-${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
