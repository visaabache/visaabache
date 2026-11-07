import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { getSettings } from "../settings";
import { tr } from "../i18n/localized";
import { asLocale } from "../i18n/config";
import { addDays, round2, toNumber } from "../utils";
import { invoiceTotals } from "./pricing";
import { notify } from "../notify";

export type InvoiceItem = { description: string; quantity: number; unitPrice: number; total: number };

/** Gap-free sequential invoice number per year, e.g. VA-2026-00042 (atomic). */
export async function nextInvoiceNumber(tx: Prisma.TransactionClient, prefix: string, date = new Date()) {
  const year = date.getFullYear();
  const key = `invoice-${year}`;
  const counter = await tx.counter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  return `${prefix}-${year}-${String(counter.value).padStart(5, "0")}`;
}

export async function createInvoice(input: {
  userId: string;
  applicationId?: string | null;
  items: { description: string; quantity: number; unitPrice: number }[];
  discount?: number;
  notes?: string;
  billing: { name: string; email: string; phone?: string | null; address?: string | null };
  locale?: string;
  sendEmail?: boolean;
}) {
  const settings = await getSettings();
  const totals = invoiceTotals(input.items, input.discount ?? 0, settings.payments.vatRate);
  const items: InvoiceItem[] = input.items.map((i) => ({ ...i, total: round2(i.quantity * i.unitPrice) }));
  if (totals.vat > 0) items.push({ description: `TVA ${settings.payments.vatRate}%`, quantity: 1, unitPrice: totals.vat, total: totals.vat });

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(tx, settings.payments.invoicePrefix || "VA");
    return tx.invoice.create({
      data: {
        number,
        userId: input.userId,
        applicationId: input.applicationId ?? null,
        items: items as unknown as Prisma.InputJsonValue,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        dueDate: addDays(new Date(), settings.payments.invoiceDueDays || 7),
        billingName: input.billing.name,
        billingEmail: input.billing.email,
        billingPhone: input.billing.phone ?? null,
        billingAddress: input.billing.address ?? null,
        notes: input.notes,
        status: totals.total <= 0 ? "PAID" : "ISSUED",
      },
    });
  });

  if (input.sendEmail !== false) {
    const locale = asLocale(input.locale);
    await notify({
      key: "invoice_issued",
      locale,
      userId: input.userId,
      email: input.billing.email,
      vars: { firstName: input.billing.name.split(" ")[0], invoiceNumber: invoice.number, amount: `${toNumber(invoice.total).toFixed(2)} MAD` },
      link: `/${locale}/account/invoices/${invoice.id}`,
      ctaLabel: tr({ fr: "Voir la facture", ar: "عرض الفاتورة", en: "View invoice" }, locale),
    });
  }
  return invoice;
}

/** Creates the service invoice for an application if none exists yet. */
export async function ensureApplicationInvoice(applicationId: string) {
  const existing = await prisma.invoice.findFirst({ where: { applicationId, status: { not: "CANCELLED" } } });
  if (existing) return existing;
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { package: true, country: true, visaType: true, user: true },
  });
  if (!app || !app.package) return null;
  const locale = asLocale(app.locale);
  const desc = `${tr(app.package.name, locale)} — ${tr(app.country.name, locale)}${app.visaType ? ` (${tr(app.visaType.name, locale)})` : ""} — ${app.reference}`;
  return createInvoice({
    userId: app.userId,
    applicationId: app.id,
    items: [{ description: desc, quantity: 1, unitPrice: toNumber(app.subtotal) }],
    discount: toNumber(app.discountAmount),
    billing: {
      name: `${app.firstName} ${app.lastName}`,
      email: app.email,
      phone: app.phone,
      address: app.user.address,
    },
    locale,
  });
}

/** Recomputes paid amount and status from confirmed payments minus refunds. */
export async function recalcInvoice(invoiceId: string) {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  if (!inv || inv.status === "CANCELLED") return inv;
  const paid = round2(
    inv.payments
      .filter((p) => ["CONFIRMED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(p.status))
      .reduce((s, p) => s + toNumber(p.amount) - toNumber(p.refundedAmount), 0),
  );
  const total = toNumber(inv.total);
  const status = paid >= total - 0.001 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "ISSUED";
  return prisma.invoice.update({ where: { id: invoiceId }, data: { amountPaid: paid, status } });
}

export function invoiceBalance(inv: { total: unknown; amountPaid: unknown }) {
  return round2(Math.max(0, toNumber(inv.total) - toNumber(inv.amountPaid)));
}
