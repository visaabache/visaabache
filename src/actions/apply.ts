"use server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { hashPassword, isStrongPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { buildChecklist } from "@/lib/domain/checklist";
import { evaluateDiscount } from "@/lib/domain/pricing";
import { getInitialStatus, uniqueApplicationReference, afterCustomerUpload } from "@/lib/domain/applications";
import { ensureApplicationInvoice } from "@/lib/domain/invoices";
import { storeUpload, UploadError } from "@/lib/storage";
import { notify, notifyAdmins } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { emailSchema, LEGAL_VERSION, nameSchema, phoneSchema } from "@/lib/validation";
import { countryWizardExtra } from "@/lib/wizard-data";
import { customerApplicationPath } from "@/lib/features";
import { round2, toNumber } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

const dateStr = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date");

const draftSchema = z.object({
  draftId: z.string().optional(),
  country: z.string().min(1),
  visaType: z.string().optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dateStr,
  nationality: z.string().trim().max(60).optional(),
  passportNumber: z.string().trim().max(30).optional(),
  passportExpiry: dateStr,
  city: z.string().trim().max(80).optional(),
  purpose: z.string().trim().max(300).optional(),
  departureDate: dateStr,
  returnDate: dateStr,
  travelers: z.union([z.string(), z.number()]).optional().transform((v) => Number(v) || 1).pipe(z.number().int().min(1).max(20)),
  additionalInfo: z.string().trim().max(2000).optional(),
  answers: z.record(z.string().max(500)).default({}),
  password: z.string().max(200).optional(),
  acceptTerms: z.boolean().optional(),
});

export type DraftInput = z.input<typeof draftSchema>;

/** Step 5: saves the draft application (creating the customer account if needed) and returns the checklist. */
export async function saveDraftAction(localeRaw: string, input: DraftInput): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip, userAgent } = await getRequestMeta();
  if (!(await rateLimit(`draft:${ip}`, 30, 3600))) return { error: t.common.tooManyRequests };
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { error: t.common.invalidForm, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const d = parsed.data;

  const country = await prisma.country.findFirst({
    where: { slug: d.country, isActive: true },
    include: { visaTypes: { where: { isActive: true } }, checklistItems: true, questions: { where: { isActive: true } } },
  });
  if (!country) return { error: t.common.error };
  const visaType = d.visaType ? country.visaTypes.find((v) => v.code === d.visaType) ?? null : null;

  // Validate required destination questions
  const globalQs = await prisma.question.findMany({ where: { countryId: null, isActive: true } });
  const missing = [...globalQs, ...country.questions]
    .filter((q) => q.required && (!q.visaTypeCodes.length || (visaType && q.visaTypeCodes.includes(visaType.code))))
    .filter((q) => !d.answers[q.key]);
  if (missing.length) return { error: t.common.invalidForm, fieldErrors: Object.fromEntries(missing.map((q) => [`answers.${q.key}`, [t.common.required]])) };

  let user = await getCurrentUser();
  if (!user) {
    if (await prisma.user.findUnique({ where: { email: d.email } })) return { error: t.apply.errors.emailTaken, fieldErrors: { email: [t.apply.errors.emailTaken] } };
    if (!d.password || !isStrongPassword(d.password)) return { error: t.apply.errors.weakPassword, fieldErrors: { password: [t.apply.errors.weakPassword] } };
    if (!d.acceptTerms) return { error: t.apply.errors.consent, fieldErrors: { acceptTerms: [t.apply.errors.consent] } };
    const created = await prisma.user.create({
      data: {
        email: d.email, passwordHash: await hashPassword(d.password), firstName: d.firstName, lastName: d.lastName, phone: d.phone, city: d.city, locale,
        consents: {
          create: [
            { type: "TERMS", version: LEGAL_VERSION, granted: true, context: "apply:account", ip, userAgent, email: d.email },
            { type: "PRIVACY_POLICY", version: LEGAL_VERSION, granted: true, context: "apply:account", ip, userAgent, email: d.email },
          ],
        },
      },
    });
    await createSession(created);
    await notify({ key: "welcome", locale, userId: created.id, email: created.email, vars: { firstName: created.firstName }, link: `/${locale}/account` });
    user = await getCurrentUser().catch(() => null);
    user ??= { ...created };
  }

  const checklist = buildChecklist(country.checklistItems, visaType?.code ?? null, d.answers).map((c) => ({
    id: c.id, title: c.title, description: c.description, required: c.required,
  }));

  const data = {
    countryId: country.id,
    visaTypeId: visaType?.id ?? null,
    locale,
    firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone,
    dateOfBirth: d.dateOfBirth, nationality: d.nationality || null, passportNumber: d.passportNumber || null, passportExpiry: d.passportExpiry,
    city: d.city || null, purpose: d.purpose || null, departureDate: d.departureDate, returnDate: d.returnDate, travelers: d.travelers,
    additionalInfo: d.additionalInfo || null, answers: d.answers as Prisma.InputJsonValue, checklist: checklist as unknown as Prisma.InputJsonValue,
  };

  let appId: string;
  if (d.draftId) {
    const existing = await prisma.application.findFirst({ where: { id: d.draftId, userId: user.id, isDraft: true } });
    if (!existing) return { error: t.common.error };
    await prisma.application.update({ where: { id: existing.id }, data });
    appId = existing.id;
  } else {
    const status = await getInitialStatus();
    const app = await prisma.application.create({ data: { ...data, reference: await uniqueApplicationReference(), userId: user.id, statusId: status.id, isDraft: true } });
    appId = app.id;
  }
  return { ok: true, data: { applicationId: appId, checklist: checklist.map((c) => ({ id: c.id, title: tr(c.title, locale), description: tr(c.description, locale), required: c.required })) } };
}

/** Customer upload (wizard and dashboard). The file is validated by magic bytes, encrypted and stored privately. */
export async function uploadDocumentAction(localeRaw: string, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.errors.forbidden };
  if (!(await rateLimit(`upload:${user.id}`, 60, 3600))) return { error: t.common.tooManyRequests };
  const applicationId = String(fd.get("applicationId") || "");
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id, archivedAt: null } });
  if (!app) return { error: t.errors.forbidden };
  const file = fd.get("file");
  if (!(file instanceof File)) return { error: t.errors.uploadEmpty };
  const requestId = String(fd.get("requestId") || "") || null;
  if (requestId && !(await prisma.documentRequest.findFirst({ where: { id: requestId, applicationId } }))) return { error: t.errors.forbidden };
  const label = String(fd.get("label") || "").trim().slice(0, 160) || file.name;
  try {
    const stored = await storeUpload(file, `applications/${app.id}`);
    const doc = await prisma.document.create({
      data: {
        applicationId: app.id, ownerId: user.id, uploadedById: user.id, requestId, checklistItemId: String(fd.get("checklistItemId") || "") || null,
        label, ...stored, direction: "CUSTOMER_UPLOAD",
      },
    });
    await prisma.application.update({ where: { id: app.id }, data: { updatedAt: new Date() } });
    await afterCustomerUpload(app.id, requestId);
    return { ok: true, data: { id: doc.id, label: doc.label, name: doc.originalName, checklistItemId: doc.checklistItemId } };
  } catch (e) {
    if (e instanceof UploadError) {
      return { error: e.code === "too_large" ? t.errors.uploadTooLarge : e.code === "bad_type" ? t.errors.uploadBadType : t.errors.uploadEmpty };
    }
    console.error("[upload]", e);
    return { error: t.common.error };
  }
}

export async function checkDiscountAction(code: string, packageSlug: string): Promise<{ ok: boolean; amount?: number }> {
  const user = await getCurrentUser();
  const { ip } = await getRequestMeta();
  if (!(await rateLimit(`discount:${user?.id || ip}`, 20, 3600))) return { ok: false };
  const [dc, pkg] = await Promise.all([
    prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } }),
    prisma.package.findFirst({ where: { slug: packageSlug, isActive: true } }),
  ]);
  if (!dc || !pkg) return { ok: false };
  const r = evaluateDiscount({ ...dc, value: toNumber(dc.value), minAmount: dc.minAmount ? toNumber(dc.minAmount) : null }, toNumber(pkg.price), pkg.slug);
  return r.ok ? { ok: true, amount: r.amount } : { ok: false };
}

const submitSchema = z.object({
  applicationId: z.string().min(1),
  packageSlug: z.string().optional(),
  discountCode: z.string().trim().max(40).optional(),
  consentTerms: z.literal(true),
  consentData: z.literal(true),
  consentIndependent: z.literal(true),
  consentWhatsapp: z.boolean().optional(),
});

/** Final step: submits the application, generates the invoice and sends confirmations. */
export async function submitApplicationAction(localeRaw: string, input: z.input<typeof submitSchema>): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.errors.forbidden };
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { error: t.apply.errors.consent };
  const d = parsed.data;
  const app = await prisma.application.findFirst({ where: { id: d.applicationId, userId: user.id, isDraft: true }, include: { country: true } });
  if (!app) return { error: t.common.error };

  const pkg = d.packageSlug ? await prisma.package.findFirst({ where: { slug: d.packageSlug, isActive: true } }) : null;
  const subtotal = pkg ? toNumber(pkg.price) : 0;
  let discountAmount = 0;
  let discountId: string | null = null;
  if (pkg && d.discountCode) {
    const dc = await prisma.discountCode.findUnique({ where: { code: d.discountCode.toUpperCase() } });
    if (dc) {
      const r = evaluateDiscount({ ...dc, value: toNumber(dc.value), minAmount: dc.minAmount ? toNumber(dc.minAmount) : null }, subtotal, pkg.slug);
      if (r.ok) {
        discountAmount = r.amount;
        discountId = dc.id;
      }
    }
  }
  const { ip, userAgent } = await getRequestMeta();
  const status = await getInitialStatus();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: app.id },
      data: {
        isDraft: false, submittedAt: now, consentAt: now, statusId: status.id, packageId: pkg?.id ?? null, discountCodeId: discountId,
        subtotal, discountAmount, totalAmount: round2(subtotal - discountAmount),
      },
    });
    await tx.applicationStatusHistory.create({ data: { applicationId: app.id, toStatusId: status.id } });
    await tx.consentRecord.createMany({
      data: [
        { userId: user.id, email: app.email, type: "TERMS", version: LEGAL_VERSION, granted: true, context: `application:${app.reference}`, ip, userAgent },
        { userId: user.id, email: app.email, type: "DATA_PROCESSING", version: LEGAL_VERSION, granted: true, context: `application:${app.reference}`, ip, userAgent },
        ...(d.consentWhatsapp ? [{ userId: user.id, email: app.email, type: "WHATSAPP" as const, version: LEGAL_VERSION, granted: true, context: `application:${app.reference}`, ip, userAgent }] : []),
      ],
    });
    if (discountId) await tx.discountCode.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
    if (d.consentWhatsapp) await tx.user.update({ where: { id: user.id }, data: { whatsappOptIn: true } });
  });
  await audit(user.id, "application.submitted", "Application", app.id, { reference: app.reference });

  if (pkg && subtotal - discountAmount > 0) await ensureApplicationInvoice(app.id);

  const destination = tr(app.country.name, locale);
  await notify({
    key: "application_received",
    locale,
    userId: user.id,
    email: app.email,
    phone: app.phone,
    whatsappOptIn: Boolean(d.consentWhatsapp),
    vars: { firstName: app.firstName, reference: app.reference, destination },
    link: customerApplicationPath(locale, app),
    ctaLabel: t.apply.goToDashboard,
  });
  const settings = await getSettings();
  if (settings.notifications.notifyAdminOnNewApplication) {
    await notifyAdmins(
      "admin_new_application",
      { reference: app.reference, destination: tr(app.country.name, "fr"), customer: `${app.firstName} ${app.lastName}`, package: pkg ? tr(pkg.name, "fr") : "—" },
      `/fr/admin/applications/${app.id}`,
    );
  }
  return { ok: true, data: { reference: app.reference, applicationId: app.id } };
}

const guestSchema = draftSchema.omit({ draftId: true, password: true, acceptTerms: true }).extend({
  packageSlug: z.string().optional(),
  discountCode: z.string().trim().max(40).optional(),
  consentTerms: z.literal(true),
  consentData: z.literal(true),
  consentIndependent: z.literal(true),
  consentWhatsapp: z.boolean().optional(),
});
export type GuestApplicationInput = z.input<typeof guestSchema>;

/**
 * Guest application (customer accounts disabled): validates and submits everything in one request — no account,
 * no password hashing, no upload. The customer gets a tracking code (the application reference) and sends the
 * documents by WhatsApp. A passwordless customer record is still kept so the admin CRM, invoices and history work.
 */
export async function submitGuestApplicationAction(localeRaw: string, input: GuestApplicationInput): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip, userAgent } = await getRequestMeta();
  if (!(await rateLimit(`guest-apply:${ip}`, 8, 3600))) return { error: t.common.tooManyRequests };
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const consentError = ["consentTerms", "consentData", "consentIndependent"].some((k) => fe[k]);
    return { error: consentError ? t.apply.errors.consent : t.common.invalidForm, fieldErrors: fe };
  }
  const d = parsed.data;

  const [country, globalQs, status, pkg] = await Promise.all([
    prisma.country.findFirst({
      where: { slug: d.country, isActive: true },
      include: { visaTypes: { where: { isActive: true } }, checklistItems: true, questions: { where: { isActive: true } } },
    }),
    prisma.question.findMany({ where: { countryId: null, isActive: true } }),
    getInitialStatus(),
    d.packageSlug ? prisma.package.findFirst({ where: { slug: d.packageSlug, isActive: true } }) : null,
  ]);
  if (!country) return { error: t.common.error };
  const visaType = d.visaType ? country.visaTypes.find((v) => v.code === d.visaType) ?? null : null;
  const missing = [...globalQs, ...country.questions]
    .filter((q) => q.required && (!q.visaTypeCodes.length || (visaType && q.visaTypeCodes.includes(visaType.code))))
    .filter((q) => !d.answers[q.key]);
  if (missing.length) return { error: t.common.invalidForm, fieldErrors: Object.fromEntries(missing.map((q) => [`answers.${q.key}`, [t.common.required]])) };

  // Pricing
  const subtotal = pkg ? toNumber(pkg.price) : 0;
  let discountAmount = 0;
  let discountId: string | null = null;
  if (pkg && d.discountCode) {
    const dc = await prisma.discountCode.findUnique({ where: { code: d.discountCode.toUpperCase() } });
    if (dc) {
      const r = evaluateDiscount({ ...dc, value: toNumber(dc.value), minAmount: dc.minAmount ? toNumber(dc.minAmount) : null }, subtotal, pkg.slug);
      if (r.ok) {
        discountAmount = r.amount;
        discountId = dc.id;
      }
    }
  }

  const checklist = buildChecklist(country.checklistItems, visaType?.code ?? null, d.answers).map((c) => ({
    id: c.id, title: c.title, description: c.description, required: c.required,
  }));
  const reference = await uniqueApplicationReference();
  const now = new Date();
  const consentBase = { email: d.email, version: LEGAL_VERSION, granted: true, context: `application:${reference}`, ip, userAgent };

  const app = await prisma.$transaction(async (tx) => {
    // Passwordless customer record ("!" is not a valid hash, so it can never be used to log in).
    const existing = await tx.user.findUnique({ where: { email: d.email } });
    const user = existing
      ? await tx.user.update({ where: { id: existing.id }, data: { phone: existing.phone || d.phone, city: existing.city || d.city || null, ...(d.consentWhatsapp ? { whatsappOptIn: true } : {}) } })
      : await tx.user.create({
          data: { email: d.email, passwordHash: "!", firstName: d.firstName, lastName: d.lastName, phone: d.phone, city: d.city || null, locale, whatsappOptIn: Boolean(d.consentWhatsapp) },
        });
    const created = await tx.application.create({
      data: {
        reference, userId: user.id, statusId: status.id, isDraft: false, submittedAt: now, consentAt: now,
        countryId: country.id, visaTypeId: visaType?.id ?? null, locale,
        firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone,
        dateOfBirth: d.dateOfBirth, nationality: d.nationality || null, passportNumber: d.passportNumber || null, passportExpiry: d.passportExpiry,
        city: d.city || null, purpose: d.purpose || null, departureDate: d.departureDate, returnDate: d.returnDate, travelers: d.travelers,
        additionalInfo: d.additionalInfo || null, answers: d.answers as Prisma.InputJsonValue, checklist: checklist as unknown as Prisma.InputJsonValue,
        packageId: pkg?.id ?? null, discountCodeId: discountId, subtotal, discountAmount, totalAmount: round2(subtotal - discountAmount),
      },
    });
    await tx.applicationStatusHistory.create({ data: { applicationId: created.id, toStatusId: status.id } });
    await tx.consentRecord.createMany({
      data: [
        { ...consentBase, userId: user.id, type: "TERMS" },
        { ...consentBase, userId: user.id, type: "DATA_PROCESSING" },
        ...(d.consentWhatsapp ? [{ ...consentBase, userId: user.id, type: "WHATSAPP" as const }] : []),
      ],
    });
    if (discountId) await tx.discountCode.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
    return created;
  });

  if (pkg && subtotal - discountAmount > 0) await ensureApplicationInvoice(app.id);
  await audit(app.userId, "application.submitted", "Application", app.id, { reference, guest: true });

  const destination = tr(country.name, locale);
  await notify({
    key: "application_received",
    locale,
    userId: app.userId,
    email: app.email,
    phone: app.phone,
    whatsappOptIn: Boolean(d.consentWhatsapp),
    vars: { firstName: app.firstName, reference, destination },
    link: customerApplicationPath(locale, app),
    ctaLabel: t.track.title,
  });
  const settings = await getSettings();
  if (settings.notifications.notifyAdminOnNewApplication) {
    await notifyAdmins(
      "admin_new_application",
      { reference, destination: tr(country.name, "fr"), customer: `${app.firstName} ${app.lastName}`, package: pkg ? tr(pkg.name, "fr") : "—" },
      `/fr/admin/applications/${app.id}`,
    );
  }
  return { ok: true, data: { reference, applicationId: app.id } };
}

/** Wizard helper: destination-specific questions and checklist rules, loaded when a destination is selected. */
export async function loadCountryWizardAction(localeRaw: string, slug: string) {
  return countryWizardExtra(String(slug).slice(0, 80), asLocale(localeRaw));
}
