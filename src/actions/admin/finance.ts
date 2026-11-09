"use server";
import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { assertPermission } from "@/lib/auth/session";
import { confirmPayment, createPayment, refundPayment, rejectPayment } from "@/lib/domain/payments";
import { createInvoice, invoiceBalance, recalcInvoice } from "@/lib/domain/invoices";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { money, str } from "@/lib/form-data";
import type { ActionState } from "@/lib/action-state";
import { customerAccountsEnabled, customerApplicationPath } from "@/lib/features";

const METHODS: PaymentMethod[] = ["CARD", "BANK_TRANSFER", "CASH", "OTHER"];

/** Records a payment received outside the gateway (cash, transfer, TPE). It is confirmed by the administrator who records it. */
export async function recordPaymentAction(locale: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("finance.manage");
  const t = getDictionary(asLocale(locale));
  const invoice = await prisma.invoice.findUnique({ where: { id: str(fd, "invoiceId") } });
  const amount = money(fd, "amount");
  const method = str(fd, "method") as PaymentMethod;
  if (!invoice || !amount || !METHODS.includes(method)) return { error: t.common.invalidForm };
  if (invoice.status === "CANCELLED") return { error: t.common.error };
  const p = await createPayment({ userId: invoice.userId, invoiceId: invoice.id, applicationId: invoice.applicationId, amount, method, status: "AWAITING_VERIFICATION" });
  await prisma.payment.update({ where: { id: p.id }, data: { providerTxnId: str(fd, "providerTxnId") || null } });
  await confirmPayment(p.id, { actorId: actor.id, note: str(fd, "note") || `Recorded manually (${method})` });
  revalidatePath(`/${asLocale(locale)}/admin`, "layout");
  return { ok: true, message: t.common.saved };
}

export async function verifyPaymentAction(locale: string, paymentId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("finance.manage");
  try {
    await confirmPayment(paymentId, { actorId: actor.id, note: str(fd, "note") || "Verified by administrator", providerTxnId: str(fd, "providerTxnId") || undefined });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error" };
  }
  revalidatePath(`/${asLocale(locale)}/admin/payments`);
  return { ok: true, message: getDictionary(asLocale(locale)).common.saved };
}

export async function rejectPaymentAction(locale: string, paymentId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("finance.manage");
  await rejectPayment(paymentId, actor.id, str(fd, "note") || "Rejected");
  revalidatePath(`/${asLocale(locale)}/admin/payments`);
  return { ok: true };
}

export async function refundPaymentAction(locale: string, paymentId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("finance.manage");
  const amount = money(fd, "amount");
  const reason = str(fd, "reason");
  if (!amount || !reason) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  try {
    await refundPayment(paymentId, actor.id, amount, reason, str(fd, "reference") || undefined);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error" };
  }
  revalidatePath(`/${asLocale(locale)}/admin/payments`);
  return { ok: true, message: getDictionary(asLocale(locale)).common.saved };
}

export async function createManualInvoiceAction(locale: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("finance.manage");
  const t = getDictionary(asLocale(locale));
  const user = await prisma.user.findUnique({ where: { email: str(fd, "email").toLowerCase() } });
  if (!user) return { error: t.common.invalidForm, fieldErrors: { email: [t.common.noResults] } };
  const items: { description: string; quantity: number; unitPrice: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const description = str(fd, `items.${i}.description`);
    const unitPrice = money(fd, `items.${i}.unitPrice`);
    const quantity = Number(str(fd, `items.${i}.quantity`)) || 1;
    if (description && unitPrice != null) items.push({ description: description.slice(0, 300), quantity, unitPrice });
  }
  if (!items.length) return { error: t.common.invalidForm };
  const appRef = str(fd, "reference");
  const app = appRef ? await prisma.application.findFirst({ where: { reference: appRef.toUpperCase(), userId: user.id } }) : null;
  const inv = await createInvoice({
    userId: user.id,
    applicationId: app?.id,
    items,
    discount: money(fd, "discount") || 0,
    notes: str(fd, "notes") || undefined,
    billing: { name: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phone, address: user.address },
    locale: user.locale,
    sendEmail: fd.get("send") === "on",
  });
  return { ok: true, redirectTo: `/${asLocale(locale)}/admin/invoices/${inv.id}` };
}

export async function cancelInvoiceAction(locale: string, invoiceId: string) {
  const actor = await assertPermission("finance.manage");
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: { where: { status: "CONFIRMED" } } } });
  if (!inv || inv.payments.length) return; // paid invoices must be refunded first (accounting integrity)
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
  await audit(actor.id, "invoice.cancelled", "Invoice", invoiceId);
  revalidatePath(`/${asLocale(locale)}/admin/invoices/${invoiceId}`);
}

export async function sendInvoiceReminderAction(locale: string, invoiceId: string) {
  const actor = await assertPermission("finance.manage");
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { user: true, application: { select: { id: true, reference: true } } } });
  if (!inv) return;
  const l = asLocale(inv.user.locale);
  await notify({
    key: "payment_reminder",
    locale: l,
    userId: inv.userId,
    email: inv.billingEmail,
    phone: inv.user.phone,
    whatsappOptIn: inv.user.whatsappOptIn,
    vars: { firstName: inv.user.firstName, invoiceNumber: inv.number, amount: `${invoiceBalance(inv).toFixed(2)} MAD` },
    link: customerAccountsEnabled() || !inv.application ? `/${l}/account/invoices/${inv.id}` : customerApplicationPath(l, inv.application),
  });
  await prisma.invoice.update({ where: { id: invoiceId }, data: { lastReminderAt: new Date() } });
  await audit(actor.id, "invoice.reminder_sent", "Invoice", invoiceId);
  await recalcInvoice(invoiceId);
  revalidatePath(`/${asLocale(locale)}/admin/invoices/${invoiceId}`);
}

