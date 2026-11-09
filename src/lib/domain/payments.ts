import "server-only";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { asLocale } from "../i18n/config";
import { notify } from "../notify";
import { tr } from "../i18n/localized";
import { round2, toNumber } from "../utils";
import { recalcInvoice } from "./invoices";
import { paymentReference } from "./references";
import { audit } from "../audit";
import { customerAccountsEnabled, customerApplicationPath } from "@/lib/features";

export async function createPayment(input: {
  userId: string;
  invoiceId: string;
  applicationId?: string | null;
  amount: number;
  method: PaymentMethod;
  provider?: "MANUAL" | "CMI";
  status?: "PENDING" | "AWAITING_VERIFICATION";
  proofDocumentId?: string | null;
}) {
  return prisma.payment.create({
    data: {
      reference: paymentReference(),
      userId: input.userId,
      invoiceId: input.invoiceId,
      applicationId: input.applicationId ?? null,
      amount: round2(input.amount),
      method: input.method,
      provider: input.provider ?? "MANUAL",
      status: input.status ?? "PENDING",
      proofDocumentId: input.proofDocumentId ?? null,
    },
  });
}

/**
 * Marks a payment as CONFIRMED. Must only be called after (a) a verified provider callback
 * or (b) a manual verification by an authorised administrator.
 */
export async function confirmPayment(paymentId: string, opts: { actorId?: string | null; providerTxnId?: string; providerPayload?: Prisma.InputJsonValue; note?: string }) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: true, invoice: true } });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "CONFIRMED") return payment;
  if (!["PENDING", "AWAITING_VERIFICATION", "FAILED"].includes(payment.status)) throw new Error("Payment cannot be confirmed in its current state");
  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedById: opts.actorId ?? null,
      providerTxnId: opts.providerTxnId ?? payment.providerTxnId,
      providerPayload: opts.providerPayload ?? undefined,
      verificationNote: opts.note ?? payment.verificationNote,
    },
  });
  if (payment.invoiceId) await recalcInvoice(payment.invoiceId);
  await audit(opts.actorId, "payment.confirmed", "Payment", paymentId, { amount: toNumber(payment.amount), method: payment.method, provider: payment.provider });
  const locale = asLocale(payment.user.locale);
  await notify({
    key: "payment_confirmed",
    locale,
    userId: payment.userId,
    email: payment.user.email,
    phone: payment.user.phone,
    whatsappOptIn: payment.user.whatsappOptIn,
    vars: {
      firstName: payment.user.firstName,
      amount: `${toNumber(payment.amount).toFixed(2)} MAD`,
      paymentReference: payment.reference,
      invoiceNumber: payment.invoice?.number ?? "",
    },
    link: await paymentsLink(locale, payment.invoiceId),
    ctaLabel: customerAccountsEnabled() ? tr({ fr: "Voir mes paiements", ar: "عرض مدفوعاتي", en: "View my payments" }, locale) : tr({ fr: "Suivre mon dossier", ar: "تتبع ملفي", en: "Track my file" }, locale),
  });
  return updated;
}

export async function rejectPayment(paymentId: string, actorId: string, note: string) {
  const p = await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED", verificationNote: note } });
  if (p.invoiceId) await recalcInvoice(p.invoiceId);
  await audit(actorId, "payment.rejected", "Payment", paymentId, { note });
  return p;
}

export async function refundPayment(paymentId: string, actorId: string, amount: number, reason: string, reference?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
  if (!payment) throw new Error("Payment not found");
  if (!["CONFIRMED", "PARTIALLY_REFUNDED"].includes(payment.status)) throw new Error("Only confirmed payments can be refunded");
  const remaining = round2(toNumber(payment.amount) - toNumber(payment.refundedAmount));
  const amt = round2(Math.min(amount, remaining));
  if (amt <= 0) throw new Error("Nothing left to refund");
  const refunded = round2(toNumber(payment.refundedAmount) + amt);
  await prisma.$transaction(async (tx) => {
    await tx.refund.create({ data: { paymentId, amount: amt, reason, reference, processedById: actorId } });
    await tx.payment.update({
      where: { id: paymentId },
      data: { refundedAmount: refunded, status: refunded >= toNumber(payment.amount) - 0.001 ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
  });
  if (payment.invoiceId) await recalcInvoice(payment.invoiceId);
  await audit(actorId, "payment.refunded", "Payment", paymentId, { amount: amt, reason });
  const locale = asLocale(payment.user.locale);
  await notify({
    key: "refund_processed",
    locale,
    userId: payment.userId,
    email: payment.user.email,
    vars: { firstName: payment.user.firstName, amount: `${amt.toFixed(2)} MAD`, paymentReference: payment.reference },
    link: await paymentsLink(locale, payment.invoiceId),
  });
}

/** Customer link for payment e-mails: their payments page, or the tracking page of the related application. */
async function paymentsLink(locale: string, invoiceId: string | null) {
  if (customerAccountsEnabled()) return `/${locale}/account/payments`;
  const inv = invoiceId ? await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { application: { select: { id: true, reference: true } } } }) : null;
  return inv?.application ? customerApplicationPath(locale, inv.application) : `/${locale}/track`;
}
