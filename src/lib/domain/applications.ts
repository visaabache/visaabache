import "server-only";
import { prisma } from "../db";
import { asLocale } from "../i18n/config";
import { tr } from "../i18n/localized";
import { notify } from "../notify";
import { audit } from "../audit";
import { applicationReference } from "./references";

export async function uniqueApplicationReference() {
  for (let i = 0; i < 10; i++) {
    const ref = applicationReference();
    const exists = await prisma.application.findUnique({ where: { reference: ref }, select: { id: true } });
    if (!exists) return ref;
  }
  throw new Error("Could not generate a unique reference");
}

export async function getInitialStatus() {
  const s =
    (await prisma.applicationStatus.findFirst({ where: { isInitial: true, isActive: true }, orderBy: { sortOrder: "asc" } })) ||
    (await prisma.applicationStatus.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
  if (!s) throw new Error("No application statuses configured");
  return s;
}

export async function getStatusByKey(key: string) {
  return prisma.applicationStatus.findUnique({ where: { key } });
}

/** Changes the status of an application, records history and notifies the customer if configured. */
export async function changeApplicationStatus(applicationId: string, statusId: string, opts: { actorId?: string | null; note?: string | null; silent?: boolean }) {
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { user: true, status: true } });
  const status = await prisma.applicationStatus.findUnique({ where: { id: statusId } });
  if (!app || !status) throw new Error("Not found");
  if (app.statusId === statusId && !opts.note) return app;

  const now = new Date();
  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        statusId,
        completedAt: status.kind === "COMPLETED" ? now : app.completedAt,
        cancelledAt: status.kind === "CANCELLED" ? now : app.cancelledAt,
        archivedAt: status.kind === "OPEN" || status.kind === "WAITING_CUSTOMER" ? null : app.archivedAt,
      },
    }),
    prisma.applicationStatusHistory.create({
      data: { applicationId, fromStatusId: app.statusId, toStatusId: statusId, note: opts.note || null, changedById: opts.actorId ?? null },
    }),
  ]);
  await audit(opts.actorId, "application.status_changed", "Application", applicationId, { from: app.status.key, to: status.key });

  if (!opts.silent && status.notifyCustomer && !app.isDraft) {
    const locale = asLocale(app.locale);
    await notify({
      key: "application_status_changed",
      locale,
      userId: app.userId,
      email: app.email,
      phone: app.phone,
      whatsappOptIn: app.user.whatsappOptIn,
      vars: {
        firstName: app.firstName,
        reference: app.reference,
        status: tr(status.label, locale),
        statusDescription: tr(status.description, locale),
        note: opts.note || "",
      },
      link: `/${locale}/account/applications/${app.id}`,
      ctaLabel: tr({ fr: "Suivre mon dossier", ar: "تتبع ملفي", en: "Track my application" }, locale),
    });
  }
  return app;
}

/** Creates missing-document requests and moves the application to the "documents required" status. */
export async function requestDocuments(applicationId: string, items: { title: string; description?: string }[], opts: { actorId: string; dueDate?: Date | null; message?: string }) {
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { user: true } });
  if (!app) throw new Error("Not found");
  await prisma.documentRequest.createMany({
    data: items.map((i) => ({ applicationId, title: i.title, description: i.description || null, dueDate: opts.dueDate ?? null })),
  });
  const docsStatus = (await getStatusByKey("documents_required")) || (await prisma.applicationStatus.findFirst({ where: { kind: "WAITING_CUSTOMER" } }));
  if (docsStatus && docsStatus.id !== app.statusId) {
    await changeApplicationStatus(applicationId, docsStatus.id, { actorId: opts.actorId, note: opts.message, silent: true });
  }
  const locale = asLocale(app.locale);
  await notify({
    key: "documents_requested",
    locale,
    userId: app.userId,
    email: app.email,
    phone: app.phone,
    whatsappOptIn: app.user.whatsappOptIn,
    vars: {
      firstName: app.firstName,
      reference: app.reference,
      documents: items.map((i) => `• ${i.title}${i.description ? ` — ${i.description}` : ""}`).join("\n"),
      note: opts.message || "",
    },
    link: `/${locale}/account/applications/${app.id}`,
    ctaLabel: tr({ fr: "Téléverser les documents", ar: "رفع الوثائق", en: "Upload documents" }, locale),
  });
  await audit(opts.actorId, "application.documents_requested", "Application", applicationId, { count: items.length });
}

/** Called after a customer uploads documents: fulfils open requests and moves status forward when nothing is missing. */
export async function afterCustomerUpload(applicationId: string, requestId?: string | null) {
  if (requestId) {
    await prisma.documentRequest.updateMany({ where: { id: requestId, applicationId, status: "OPEN" }, data: { status: "FULFILLED", fulfilledAt: new Date() } });
  }
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { status: true } });
  if (!app || app.isDraft) return;
  const open = await prisma.documentRequest.count({ where: { applicationId, status: "OPEN" } });
  if (open === 0 && app.status.key === "documents_required") {
    const received = await getStatusByKey("documents_received");
    if (received) await changeApplicationStatus(applicationId, received.id, { silent: false });
  }
}
