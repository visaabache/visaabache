"use server";
import { revalidatePath } from "next/cache";
import type { InquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { assertPermission } from "@/lib/auth/session";
import { anonymizeUser } from "@/lib/domain/automation";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { str } from "@/lib/form-data";
import type { ActionState } from "@/lib/action-state";

export async function setCustomerActiveAction(locale: string, userId: string, active: boolean) {
  const actor = await assertPermission("customers.manage");
  await prisma.user.update({ where: { id: userId, role: "CUSTOMER" }, data: { isActive: active } });
  if (!active) await prisma.session.deleteMany({ where: { userId } });
  await audit(actor.id, active ? "customer.activated" : "customer.deactivated", "User", userId);
  revalidatePath(`/${asLocale(locale)}/admin/customers/${userId}`);
}

export async function anonymizeCustomerAction(locale: string, userId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("compliance.manage");
  if (str(fd, "confirm").toUpperCase() !== "ANONYMISE") return { error: getDictionary(asLocale(locale)).admin.customers.anonymizeConfirm };
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || u.role !== "CUSTOMER") return { error: "Not a customer" };
  await anonymizeUser(userId);
  await prisma.dataRequest.updateMany({ where: { userId, type: "DELETION", status: "PENDING" }, data: { status: "COMPLETED", completedAt: new Date(), response: "Anonymised" } });
  await audit(actor.id, "customer.anonymized", "User", userId);
  return { ok: true, redirectTo: `/${asLocale(locale)}/admin/customers` };
}

export async function updateInquiryAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("inquiries.manage");
  const status = str(fd, "status") as InquiryStatus;
  if (!["NEW", "IN_PROGRESS", "CLOSED"].includes(status)) return { error: "Invalid" };
  await prisma.inquiry.update({ where: { id }, data: { status, internalNote: str(fd, "internalNote").slice(0, 2000) || null } });
  revalidatePath(`/${asLocale(locale)}/admin/inquiries`);
  return { ok: true, message: getDictionary(asLocale(locale)).common.saved };
}

export async function deleteInquiryAction(locale: string, id: string) {
  const actor = await assertPermission("inquiries.manage");
  await prisma.inquiry.delete({ where: { id } });
  await audit(actor.id, "inquiry.deleted", "Inquiry", id);
  revalidatePath(`/${asLocale(locale)}/admin/inquiries`);
}

export async function staffReplyTicketAction(locale: string, ticketId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("support.manage");
  const body = str(fd, "body").slice(0, 5000);
  if (!body) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
  if (!ticket) return { error: "Not found" };
  await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId, authorId: actor.id, fromStaff: true, body } }),
    prisma.ticket.update({ where: { id: ticketId }, data: { status: "ANSWERED" } }),
  ]);
  const l = asLocale(ticket.user.locale);
  await notify({
    key: "ticket_reply",
    locale: l,
    userId: ticket.userId,
    email: ticket.user.email,
    vars: { firstName: ticket.user.firstName, subject: ticket.subject },
    link: `/${l}/account/support/${ticket.id}`,
  });
  revalidatePath(`/${asLocale(locale)}/admin/support/${ticketId}`);
  return { ok: true };
}

export async function setTicketStatusAction(locale: string, ticketId: string, status: "OPEN" | "CLOSED") {
  await assertPermission("support.manage");
  await prisma.ticket.update({ where: { id: ticketId }, data: { status } });
  revalidatePath(`/${asLocale(locale)}/admin/support/${ticketId}`);
}
