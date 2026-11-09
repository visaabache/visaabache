import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { getSettings } from "../settings";
import { asLocale } from "../i18n/config";
import { tr } from "../i18n/localized";
import { notify } from "../notify";
import { storage } from "../storage";
import { addDays } from "../utils";
import { invoiceBalance } from "./invoices";
import { customerAccountsEnabled, customerApplicationPath } from "@/lib/features";

/**
 * Runs all scheduled automations. Idempotent — safe to run every hour (cron) or manually from the admin panel.
 * - Missing document reminders
 * - Payment reminders for unpaid invoices
 * - Archiving of completed / cancelled applications
 * - Document deletion according to the retention policy
 * - Deletion of abandoned drafts, expired sessions and tokens
 * - Optional anonymisation of inactive customer accounts
 */
export async function runAutomations(trigger: "CRON" | "MANUAL") {
  const run = await prisma.automationRun.create({ data: { trigger } });
  const s = await getSettings();
  const now = new Date();
  const summary: Record<string, number> = {
    documentReminders: 0, paymentReminders: 0, archived: 0, documentsDeleted: 0, draftsDeleted: 0, sessionsPurged: 0, customersAnonymized: 0,
  };
  try {
    // 1. Missing document reminders
    const remindBefore = addDays(now, -s.notifications.missingDocsReminderDays);
    const requests = await prisma.documentRequest.findMany({
      where: {
        status: "OPEN",
        createdAt: { lt: remindBefore },
        OR: [{ lastRemindedAt: null }, { lastRemindedAt: { lt: remindBefore } }],
        application: { archivedAt: null, isDraft: false, status: { kind: { in: ["OPEN", "WAITING_CUSTOMER"] } } },
      },
      include: { application: { include: { user: true } } },
    });
    const byApp = new Map<string, typeof requests>();
    for (const r of requests) byApp.set(r.applicationId, [...(byApp.get(r.applicationId) || []), r]);
    for (const [appId, reqs] of byApp) {
      const app = reqs[0].application;
      const sent = await prisma.notificationLog.count({ where: { templateKey: "documents_reminder", recipient: app.email, createdAt: { gt: app.createdAt } } });
      if (sent >= s.notifications.maxReminders) continue;
      const locale = asLocale(app.locale);
      await notify({
        key: "documents_reminder",
        locale,
        userId: app.userId,
        email: app.email,
        phone: app.phone,
        whatsappOptIn: app.user.whatsappOptIn,
        vars: { firstName: app.firstName, reference: app.reference, documents: reqs.map((r) => `• ${r.title}`).join("\n") },
        link: customerApplicationPath(locale, { id: appId, reference: app.reference }),
        ctaLabel: customerAccountsEnabled() ? tr({ fr: "Téléverser", ar: "رفع", en: "Upload" }, locale) : tr({ fr: "Suivre mon dossier", ar: "تتبع ملفي", en: "Track my file" }, locale),
      });
      await prisma.documentRequest.updateMany({ where: { id: { in: reqs.map((r) => r.id) } }, data: { lastRemindedAt: now } });
      summary.documentReminders++;
    }

    // 2. Payment reminders
    const payBefore = addDays(now, -s.notifications.paymentReminderDays);
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["ISSUED", "PARTIALLY_PAID"] },
        issueDate: { lt: payBefore },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: payBefore } }],
      },
      include: { user: true, application: { include: { status: true } } },
    });
    for (const inv of invoices) {
      if (inv.application && ["CANCELLED"].includes(inv.application.status.kind)) continue;
      const balance = invoiceBalance(inv);
      if (balance <= 0) continue;
      const sent = await prisma.notificationLog.count({ where: { templateKey: "payment_reminder", recipient: inv.billingEmail, subject: { contains: inv.number } } });
      if (sent >= s.notifications.maxReminders) continue;
      const locale = asLocale(inv.user.locale);
      await notify({
        key: "payment_reminder",
        locale,
        userId: inv.userId,
        email: inv.billingEmail,
        phone: inv.user.phone,
        whatsappOptIn: inv.user.whatsappOptIn,
        vars: { firstName: inv.user.firstName, invoiceNumber: inv.number, amount: `${balance.toFixed(2)} MAD` },
        link: `/${locale}/account/invoices/${inv.id}`,
        ctaLabel: tr({ fr: "Payer", ar: "أداء", en: "Pay now" }, locale),
      });
      await prisma.invoice.update({ where: { id: inv.id }, data: { lastReminderAt: now } });
      summary.paymentReminders++;
    }

    // 3. Archive completed / cancelled applications
    const archiveBefore = addDays(now, -s.retention.archiveCompletedAfterDays);
    const arch = await prisma.application.updateMany({
      where: {
        archivedAt: null,
        OR: [
          { status: { kind: "COMPLETED" }, completedAt: { lt: archiveBefore } },
          { status: { kind: "CANCELLED" }, cancelledAt: { lt: archiveBefore } },
        ],
      },
      data: { archivedAt: now },
    });
    summary.archived = arch.count;

    // 4. Delete documents of closed applications after the retention period
    if (s.retention.deleteDocumentsAfterDays > 0) {
      const delBefore = addDays(now, -s.retention.deleteDocumentsAfterDays);
      const docs = await prisma.document.findMany({
        where: {
          application: {
            OR: [
              { status: { kind: "COMPLETED" }, completedAt: { lt: delBefore } },
              { status: { kind: "CANCELLED" }, cancelledAt: { lt: delBefore } },
            ],
          },
          payments: { none: {} }, // keep payment proofs (accounting retention)
        },
        select: { id: true, storageKey: true },
        take: 500,
      });
      for (const d of docs) {
        await storage().remove(d.storageKey);
        await prisma.document.delete({ where: { id: d.id } });
      }
      summary.documentsDeleted = docs.length;
    }

    // 5. Abandoned drafts
    const drafts = await prisma.application.findMany({
      where: { isDraft: true, updatedAt: { lt: addDays(now, -s.retention.deleteDraftsAfterDays) } },
      select: { id: true, documents: { select: { storageKey: true } } },
      take: 200,
    });
    for (const d of drafts) {
      for (const doc of d.documents) await storage().remove(doc.storageKey);
      await prisma.application.delete({ where: { id: d.id } });
    }
    summary.draftsDeleted = drafts.length;

    // 6. Expired sessions / tokens / rate limits
    const sess = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
    await prisma.verificationToken.deleteMany({ where: { expiresAt: { lt: now } } });
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
    summary.sessionsPurged = sess.count;

    // 7. Optional anonymisation of inactive customers without open files or unpaid invoices
    if (s.retention.anonymizeInactiveCustomersAfterDays > 0) {
      const cutoff = addDays(now, -s.retention.anonymizeInactiveCustomersAfterDays);
      const users = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          anonymizedAt: null,
          OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null, createdAt: { lt: cutoff } }],
          applications: { none: { archivedAt: null, isDraft: false } },
          invoices: { none: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } } },
        },
        select: { id: true },
        take: 100,
      });
      for (const u of users) {
        await anonymizeUser(u.id);
        summary.customersAnonymized++;
      }
    }

    await prisma.automationRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), summary: summary as Prisma.InputJsonValue } });
    return summary;
  } catch (e) {
    await prisma.automationRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), error: e instanceof Error ? e.message : String(e), summary } });
    throw e;
  }
}

/**
 * Anonymises a customer (right to erasure). Invoices and payments are retained for legal accounting
 * obligations, but personal identity documents are deleted and identity fields are scrubbed.
 */
export async function anonymizeUser(userId: string) {
  const docs = await prisma.document.findMany({ where: { ownerId: userId }, select: { id: true, storageKey: true, payments: { select: { id: true } } } });
  for (const d of docs) {
    if (d.payments.length) continue;
    await storage().remove(d.storageKey);
    await prisma.document.delete({ where: { id: d.id } });
  }
  const anon = `deleted-${userId.slice(-8)}@anonymized.invalid`;
  await prisma.application.updateMany({
    where: { userId },
    data: {
      firstName: "Anonymised", lastName: "", email: anon, phone: "", dateOfBirth: null, passportNumber: null, passportExpiry: null,
      nationality: null, city: null, additionalInfo: null, answers: Prisma.DbNull,
    },
  });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: anon, firstName: "Anonymised", lastName: "", phone: null, city: null, address: null, isActive: false,
      anonymizedAt: new Date(), passwordHash: "!", marketingOptIn: false, whatsappOptIn: false,
    },
  });

}
