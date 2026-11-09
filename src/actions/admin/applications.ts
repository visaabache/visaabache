"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { assertPermission } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/permissions";
import { changeApplicationStatus, requestDocuments } from "@/lib/domain/applications";
import { ensureApplicationInvoice } from "@/lib/domain/invoices";
import { storeUpload, storage, UploadError } from "@/lib/storage";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { date, int, str } from "@/lib/form-data";
import type { ActionState } from "@/lib/action-state";
import { customerAccountsEnabled, customerApplicationPath } from "@/lib/features";

const path = (locale: string, id: string) => `/${asLocale(locale)}/admin/applications/${id}`;

export async function changeStatusAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const statusId = str(fd, "statusId");
  if (!statusId) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  await changeApplicationStatus(id, statusId, { actorId: actor.id, note: str(fd, "note") || null });
  revalidatePath(path(locale, id));
  return { ok: true, message: getDictionary(asLocale(locale)).common.saved };
}

export async function addNoteAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const body = str(fd, "body").slice(0, 5000);
  if (!body) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  await prisma.applicationNote.create({ data: { applicationId: id, authorId: actor.id, body } });
  revalidatePath(path(locale, id));
  return { ok: true };
}

export async function requestDocsAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const items = str(fd, "items")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("|");
      return { title: title.trim().slice(0, 160), description: rest.join("|").trim().slice(0, 500) || undefined };
    });
  if (!items.length) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  await requestDocuments(id, items, { actorId: actor.id, dueDate: date(fd, "dueDate"), message: str(fd, "message") || undefined });
  revalidatePath(path(locale, id));
  return { ok: true, message: getDictionary(asLocale(locale)).common.success };
}

export async function cancelDocRequestAction(locale: string, appId: string, requestId: string) {
  await assertPermission("applications.manage");
  await prisma.documentRequest.updateMany({ where: { id: requestId, applicationId: appId }, data: { status: "CANCELLED" } });
  revalidatePath(path(locale, appId));
}

export async function reviewDocumentAction(locale: string, appId: string, docId: string, decision: "ACCEPTED" | "REJECTED", _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const note = str(fd, "note").slice(0, 500);
  const doc = await prisma.document.findFirst({ where: { id: docId, applicationId: appId }, include: { application: { include: { user: true } } } });
  if (!doc || !doc.application) return { error: "Not found" };
  await prisma.document.update({ where: { id: docId }, data: { status: decision, reviewNote: note || null, reviewedAt: new Date() } });
  await audit(actor.id, `document.${decision.toLowerCase()}`, "Document", docId, { note });
  if (decision === "REJECTED") {
    const app = doc.application;
    await prisma.documentRequest.create({ data: { applicationId: app.id, title: doc.label, description: note || null } });
    const l = asLocale(app.locale);
    await notify({
      key: "document_rejected",
      locale: l,
      userId: app.userId,
      email: app.email,
      phone: app.phone,
      whatsappOptIn: app.user.whatsappOptIn,
      vars: { firstName: app.firstName, reference: app.reference, document: doc.label, note },
      link: customerApplicationPath(l, app),
      ctaLabel: customerAccountsEnabled() ? tr({ fr: "Téléverser", ar: "رفع", en: "Upload" }, l) : tr({ fr: "Suivre mon dossier", ar: "تتبع ملفي", en: "Track my file" }, l),
    });
  }
  revalidatePath(path(locale, appId));
  return { ok: true };
}

export async function shareDocumentAction(locale: string, appId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const t = getDictionary(asLocale(locale));
  const app = await prisma.application.findUnique({ where: { id: appId } });
  const file = fd.get("file");
  if (!app || !(file instanceof File)) return { error: t.errors.uploadEmpty };
  try {
    const stored = await storeUpload(file, `applications/${app.id}/shared`);
    await prisma.document.create({
      data: { applicationId: app.id, ownerId: app.userId, uploadedById: actor.id, label: str(fd, "label") || file.name, ...stored, direction: "SHARED_BY_STAFF", status: "ACCEPTED" },
    });
    const l = asLocale(app.locale);
    await prisma.notification.create({
      data: { userId: app.userId, title: `${app.reference} — ${tr({ fr: "Nouveau document disponible", ar: "وثيقة جديدة متاحة", en: "New document available" }, l)}`, body: str(fd, "label") || file.name, link: customerApplicationPath(l, app) },
    });
    revalidatePath(path(locale, appId));
    return { ok: true, message: t.common.success };
  } catch (e) {
    if (e instanceof UploadError) return { error: e.code === "too_large" ? t.errors.uploadTooLarge : t.errors.uploadBadType };
    throw e;
  }
}

export async function deleteDocumentAction(locale: string, appId: string, docId: string) {
  const actor = await assertPermission("applications.manage");
  const doc = await prisma.document.findFirst({ where: { id: docId, applicationId: appId }, include: { payments: true } });
  if (!doc || doc.payments.length) return;
  await storage().remove(doc.storageKey);
  await prisma.document.delete({ where: { id: docId } });
  await audit(actor.id, "document.deleted", "Document", docId, { applicationId: appId, label: doc.label });
  revalidatePath(path(locale, appId));
}

export async function updateApplicationMetaAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("applications.manage");
  const assigneeId = str(fd, "assigneeId") || null;
  if (assigneeId) {
    const u = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!u || !isStaffRole(u.role)) return { error: "Invalid assignee" };
  }
  const packageId = str(fd, "packageId") || null;
  const app = await prisma.application.findUniqueOrThrow({ where: { id } });
  let pricing = {};
  if (packageId !== app.packageId) {
    const pkg = packageId ? await prisma.package.findUnique({ where: { id: packageId } }) : null;
    const subtotal = pkg ? Number(pkg.price) : 0;
    pricing = { packageId, subtotal, discountAmount: 0, totalAmount: subtotal };
  }
  await prisma.application.update({ where: { id }, data: { deadline: date(fd, "deadline"), priority: int(fd, "priority"), assigneeId, ...pricing } });
  await audit(actor.id, "application.updated", "Application", id);
  revalidatePath(path(locale, id));
  return { ok: true, message: getDictionary(asLocale(locale)).common.saved };
}

export async function archiveApplicationAction(locale: string, id: string, archive: boolean) {
  const actor = await assertPermission("applications.manage");
  await prisma.application.update({ where: { id }, data: { archivedAt: archive ? new Date() : null } });
  await audit(actor.id, archive ? "application.archived" : "application.restored", "Application", id);
  revalidatePath(path(locale, id));
}

export async function generateInvoiceAction(locale: string, id: string) {
  await assertPermission("finance.manage");
  await ensureApplicationInvoice(id);
  revalidatePath(path(locale, id));
}
