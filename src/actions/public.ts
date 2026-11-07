"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr, formatDate } from "@/lib/i18n/localized";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { getCurrentUser } from "@/lib/auth/session";
import { notify, notifyAdmins } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { checkbox, emailSchema, formToObject, LEGAL_VERSION, nameSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const inquirySchema = z.object({
  type: z.enum(["SERVICE", "CONTACT", "CONSULTATION"]),
  serviceId: z.string().optional(),
  name: nameSchema,
  email: emailSchema,
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(5).max(4000),
  consent: checkbox,
  website: z.string().optional(), // honeypot
});

export async function submitInquiry(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip, userAgent } = await getRequestMeta();
  if (!(await rateLimit(`inquiry:${ip}`, 8, 3600))) return { error: t.common.tooManyRequests };
  const parsed = inquirySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: t.common.invalidForm, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  if (d.website) return { ok: true, message: t.contact.sent }; // bot
  if (!d.consent) return { error: t.apply.errors.consent, fieldErrors: { consent: [t.apply.errors.consent] } };
  const user = await getCurrentUser();
  const service = d.serviceId ? await prisma.service.findUnique({ where: { id: d.serviceId } }) : null;
  const subject = d.subject || (service ? tr(service.name, locale) : d.type === "CONSULTATION" ? t.contact.consultationTitle : t.contact.title);

  const inquiry = await prisma.inquiry.create({
    data: { type: d.type, serviceId: service?.id ?? null, userId: user?.id ?? null, name: d.name, email: d.email, phone: d.phone || null, subject, message: d.message, locale },
  });
  await prisma.consentRecord.create({ data: { userId: user?.id ?? null, email: d.email, type: "PRIVACY_POLICY", version: LEGAL_VERSION, granted: true, context: `inquiry:${inquiry.id}`, ip, userAgent } });

  await notify({ key: "inquiry_received", locale, email: d.email, vars: { firstName: d.name.split(" ")[0], subject } });
  const settings = await getSettings();
  if (settings.notifications.notifyAdminOnNewInquiry) {
    await notifyAdmins("admin_new_inquiry", { customer: d.name, subject, message: d.message.slice(0, 500) }, `/fr/admin/inquiries?open=${inquiry.id}`);
  }
  return { ok: true, message: d.type === "SERVICE" ? t.services.inquirySent : t.contact.sent };
}

export async function trackApplication(localeRaw: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = asLocale(localeRaw);
  const t = getDictionary(locale);
  const { ip } = await getRequestMeta();
  if (!(await rateLimit(`track:${ip}`, 15, 900))) return { error: t.common.tooManyRequests };
  const reference = String(fd.get("reference") || "").trim().toUpperCase();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const app = await prisma.application.findFirst({
    where: { reference, email: { equals: email, mode: "insensitive" }, isDraft: false },
    include: { status: true, country: true },
  });
  if (!app) return { error: t.track.notFound };
  return {
    ok: true,
    data: {
      reference: app.reference,
      destination: tr(app.country.name, locale),
      status: tr(app.status.label, locale),
      statusDescription: tr(app.status.description, locale),
      color: app.status.color,
      submittedAt: formatDate(app.submittedAt, locale),
    },
  };
}
