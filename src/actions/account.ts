"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { asLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser, destroyAllSessions, createSession } from "@/lib/auth/session";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { storeUpload, UploadError } from "@/lib/storage";
import { createPayment } from "@/lib/domain/payments";
import { invoiceBalance } from "@/lib/domain/invoices";
import { buildCmiRequest } from "@/lib/payments/cmi";
import { cmiConfigured, getSettings } from "@/lib/settings";
import { notifyAdmins } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { appUrl, toNumber } from "@/lib/utils";
import { checkbox, formToObject, LEGAL_VERSION, nameSchema, phoneSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

async function requireCustomer(locale: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error(getDictionary(asLocale(locale)).errors.forbidden);
  return user;
}

const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  locale: z.string().refine(isLocale),
  whatsappOptIn: checkbox,
  marketingOptIn: checkbox,
});

export async function updateProfileAction(localeRaw: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await requireCustomer(localeRaw);
  const parsed = profileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: t.common.invalidForm, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const { ip, userAgent } = await getRequestMeta();
  if (d.marketingOptIn !== user.marketingOptIn) {
    await prisma.consentRecord.create({ data: { userId: user.id, email: user.email, type: "MARKETING", version: LEGAL_VERSION, granted: d.marketingOptIn, context: "profile", ip, userAgent } });
  }
  if (d.whatsappOptIn !== user.whatsappOptIn) {
    await prisma.consentRecord.create({ data: { userId: user.id, email: user.email, type: "WHATSAPP", version: LEGAL_VERSION, granted: d.whatsappOptIn, context: "profile", ip, userAgent } });
  }
  await prisma.user.update({ where: { id: user.id }, data: { ...d, city: d.city || null, address: d.address || null } });
  return { ok: true, message: t.common.saved };
}

export async function changePasswordAction(localeRaw: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await requireCustomer(localeRaw);
  if (!(await rateLimit(`pw:${user.id}`, 5, 900))) return { error: t.common.tooManyRequests };
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(String(fd.get("currentPassword") || ""), row.passwordHash))) return { error: t.account.wrongPassword };
  const pw = String(fd.get("newPassword") || "");
  if (!isStrongPassword(pw)) return { error: t.auth.weakPassword };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw) } });
  await destroyAllSessions(user.id);
  await createSession(row);
  await audit(user.id, "auth.password_changed", "User", user.id);
  return { ok: true, message: t.account.passwordChanged };
}

export async function requestDeletionAction(localeRaw: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await requireCustomer(localeRaw);
  const confirm = String(fd.get("confirm") || "").trim().toUpperCase();
  if (!["DELETE", "SUPPRIMER", "حذف"].includes(confirm)) return { error: t.account.deletionConfirm };
  const existing = await prisma.dataRequest.findFirst({ where: { userId: user.id, type: "DELETION", status: "PENDING" } });
  if (!existing) {
    await prisma.dataRequest.create({ data: { userId: user.id, email: user.email, type: "DELETION", details: String(fd.get("details") || "").slice(0, 1000) } });
    await audit(user.id, "privacy.deletion_requested", "User", user.id);
  }
  return { ok: true, message: t.account.deletionRequested };
}

export async function markNotificationsReadAction(localeRaw: string) {
  const user = await requireCustomer(localeRaw);
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath(`/${asLocale(localeRaw)}/account`, "layout");
}

export async function createTicketAction(localeRaw: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await requireCustomer(localeRaw);
  if (!(await rateLimit(`ticket:${user.id}`, 10, 3600))) return { error: t.common.tooManyRequests };
  const subject = String(fd.get("subject") || "").trim().slice(0, 160);
  const body = String(fd.get("body") || "").trim().slice(0, 5000);
  if (!subject || !body) return { error: t.common.invalidForm };
  const applicationId = String(fd.get("applicationId") || "") || null;
  if (applicationId && !(await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } }))) return { error: t.errors.forbidden };
  const ticket = await prisma.ticket.create({ data: { userId: user.id, subject, applicationId, messages: { create: { authorId: user.id, body } } } });
  await notifyAdmins("admin_new_inquiry", { customer: `${user.firstName} ${user.lastName}`, subject, message: body.slice(0, 500) }, `/fr/admin/support/${ticket.id}`);
  return { ok: true, redirectTo: `/${locale}/account/support/${ticket.id}` };
}

export async function replyTicketAction(localeRaw: string, ticketId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const t = getDictionary(asLocale(localeRaw));
  const user = await requireCustomer(localeRaw);
  if (!(await rateLimit(`ticket-reply:${user.id}`, 30, 3600))) return { error: t.common.tooManyRequests };
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, userId: user.id } });
  if (!ticket || ticket.status === "CLOSED") return { error: t.account.ticketClosed };
  const body = String(fd.get("body") || "").trim().slice(0, 5000);
  if (!body) return { error: t.common.invalidForm };
  await prisma.$transaction(async (tx) => {
    await tx.ticketMessage.create({ data: { ticketId, authorId: user.id, body } });
    await tx.ticket.update({ where: { id: ticketId }, data: { status: "OPEN" } });
  });
  return { ok: true };
}

export async function submitReviewAction(localeRaw: string, applicationId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await requireCustomer(localeRaw);
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id, status: { kind: "COMPLETED" } }, include: { testimonial: true } });
  if (!app || app.testimonial) return { error: t.errors.forbidden };
  const rating = Math.min(5, Math.max(1, Number(fd.get("rating")) || 5));
  const content = String(fd.get("content") || "").trim().slice(0, 1500);
  const displayName = String(fd.get("displayName") || "").trim().slice(0, 60) || `${user.firstName} ${user.lastName.charAt(0)}.`;
  if (content.length < 10) return { error: t.common.invalidForm };
  await prisma.testimonial.create({
    data: {
      userId: user.id, applicationId: app.id, countryId: app.countryId, displayName, city: user.city, rating, content, locale,
      source: "CUSTOMER_SUBMITTED", consentToPublish: fd.get("consent") === "on",
      // A completed file of a logged-in customer = verified client. Publication remains a manual admin decision.
      isVerified: true, isPublished: false,
    },
  });
  return { ok: true, message: t.account.reviewThanks };
}

/** Customer declares a bank transfer and uploads the receipt → AWAITING_VERIFICATION (never auto-confirmed). */
export async function declareTransferAction(localeRaw: string, invoiceId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await requireCustomer(localeRaw);
  const inv = await prisma.invoice.findFirst({ where: { id: invoiceId, userId: user.id, status: { in: ["ISSUED", "PARTIALLY_PAID"] } } });
  if (!inv) return { error: t.errors.forbidden };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: t.errors.uploadEmpty };
  try {
    const stored = await storeUpload(file, `payments/${user.id}`);
    const doc = await prisma.document.create({
      data: { ownerId: user.id, uploadedById: user.id, applicationId: inv.applicationId, label: `Virement ${inv.number}`, ...stored, direction: "CUSTOMER_UPLOAD", status: "PENDING_REVIEW" },
    });
    const amount = Number(String(fd.get("amount") || "").replace(",", ".")) || invoiceBalance(inv);
    const p = await createPayment({ userId: user.id, invoiceId: inv.id, applicationId: inv.applicationId, amount, method: "BANK_TRANSFER", status: "AWAITING_VERIFICATION", proofDocumentId: doc.id });
    await notifyAdmins("admin_payment_declared", { customer: `${user.firstName} ${user.lastName}`, amount: `${amount.toFixed(2)} MAD`, paymentReference: p.reference }, `/fr/admin/payments?status=AWAITING_VERIFICATION`);
    return { ok: true, message: t.account.proofSent };
  } catch (e) {
    if (e instanceof UploadError) return { error: e.code === "too_large" ? t.errors.uploadTooLarge : t.errors.uploadBadType };
    throw e;
  }
}

/** Creates a pending CMI payment and returns the signed form fields for the hosted payment page. */
export async function startCardPaymentAction(localeRaw: string, invoiceId: string): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await requireCustomer(localeRaw);
  const settings = await getSettings();
  if (!settings.payments.cardEnabled || !cmiConfigured()) return { error: t.common.error };
  const inv = await prisma.invoice.findFirst({ where: { id: invoiceId, userId: user.id, status: { in: ["ISSUED", "PARTIALLY_PAID"] } } });
  if (!inv) return { error: t.errors.forbidden };
  const amount = invoiceBalance(inv);
  if (amount <= 0) return { error: t.common.error };
  const p = await createPayment({ userId: user.id, invoiceId: inv.id, applicationId: inv.applicationId, amount, method: "CARD", provider: "CMI" });
  const { url, params } = buildCmiRequest({
    orderId: p.reference,
    amount: toNumber(p.amount),
    okUrl: appUrl(`/${locale}/account/payments?return=ok&ref=${p.reference}`),
    failUrl: appUrl(`/${locale}/account/payments?return=fail&ref=${p.reference}`),
    callbackUrl: appUrl(`/api/payments/cmi/callback`),
    shopUrl: appUrl(`/${locale}/account/invoices/${inv.id}`),
    lang: locale,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    phone: user.phone || undefined,
  });
  return { ok: true, data: { url, params } };
}
