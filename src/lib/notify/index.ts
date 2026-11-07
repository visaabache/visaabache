import "server-only";
import type { Channel } from "@prisma/client";
import { prisma } from "../db";
import { getSettings } from "../settings";
import { asLocale, type Locale } from "../i18n/config";
import { tr } from "../i18n/localized";
import { appUrl, fillTemplate } from "../utils";
import { renderEmailHtml, sendEmail } from "./email";
import { sendWhatsApp, whatsappApiConfigured } from "./whatsapp";

export const TEMPLATE_KEYS = [
  "welcome",
  "password_reset",
  "application_received",
  "application_status_changed",
  "documents_requested",
  "documents_reminder",
  "document_rejected",
  "invoice_issued",
  "payment_confirmed",
  "payment_reminder",
  "refund_processed",
  "ticket_reply",
  "inquiry_received",
  "admin_new_application",
  "admin_new_inquiry",
  "admin_payment_declared",
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

type Vars = Record<string, string | number | null | undefined>;

async function loadTemplate(key: string, channel: Channel, locale: Locale) {
  const rows = await prisma.notificationTemplate.findMany({ where: { key, channel, isActive: true } });
  return rows.find((r) => r.locale === locale) || rows.find((r) => r.locale === "fr") || rows.find((r) => r.locale === "en") || null;
}

async function log(channel: Channel, recipient: string, templateKey: string, subject: string | null, status: string, userId?: string | null, error?: string) {
  await prisma.notificationLog
    .create({ data: { channel, recipient, templateKey, subject, status, userId: userId ?? null, error: error?.slice(0, 500) } })
    .catch(() => {});
}

export type NotifyInput = {
  key: TemplateKey;
  locale?: string | null;
  vars: Vars;
  userId?: string | null; // creates an in-app notification
  email?: string | null;
  phone?: string | null; // WhatsApp (only if customer opted in and the Cloud API is configured)
  whatsappOptIn?: boolean;
  link?: string; // path, e.g. /fr/account/applications/xxx
  ctaLabel?: string;
};

/** Sends a templated notification across email, in-app and (optionally) WhatsApp. Never throws. */
export async function notify(input: NotifyInput) {
  try {
    const settings = await getSettings();
    const locale = asLocale(input.locale);
    const vars: Vars = {
      businessName: settings.business.name,
      businessPhone: settings.business.phone,
      businessEmail: settings.business.email,
      link: input.link ? appUrl(input.link) : appUrl(`/${locale}`),
      ...input.vars,
    };
    const footer = `${settings.business.name} — ${tr(settings.payments.invoiceFooter, locale)}`;

    if (input.email && settings.notifications.emailEnabled) {
      const tpl = await loadTemplate(input.key, "EMAIL", locale);
      if (tpl) {
        const subject = fillTemplate(tpl.subject || "", vars);
        const text = fillTemplate(tpl.body, vars);
        const res = await sendEmail({
          to: input.email,
          subject,
          text,
          html: renderEmailHtml({
            subject,
            text,
            locale,
            footer,
            cta: input.link && input.ctaLabel ? { label: input.ctaLabel, url: String(vars.link) } : undefined,
          }),
        });
        await log("EMAIL", input.email, input.key, subject, res.ok ? "SENT" : "FAILED", input.userId, res.error);
      }
    }

    if (input.userId) {
      const tpl = (await loadTemplate(input.key, "IN_APP", locale)) || (await loadTemplate(input.key, "EMAIL", locale));
      if (tpl) {
        const title = fillTemplate(tpl.subject || "", vars);
        const body = fillTemplate(tpl.body, vars).split("\n\n").slice(0, 2).join("\n\n").slice(0, 600);
        await prisma.notification.create({ data: { userId: input.userId, title, body, link: input.link } });
      }
    }

    if (input.phone && input.whatsappOptIn && settings.whatsapp.notifyCustomers && whatsappApiConfigured()) {
      const tpl = await loadTemplate(input.key, "WHATSAPP", locale);
      if (tpl) {
        const text = fillTemplate(tpl.body, vars);
        const res = await sendWhatsApp(input.phone, text);
        await log("WHATSAPP", input.phone, input.key, null, res.ok ? "SENT" : "FAILED", input.userId, res.error);
      }
    }
  } catch (e) {
    console.error("[notify]", input.key, e);
  }
}

/** Renders a WhatsApp template to text (used for click-to-chat links the owner sends manually). */
export async function renderWhatsAppText(key: TemplateKey, locale: string, vars: Vars) {
  const settings = await getSettings();
  const tpl = await loadTemplate(key, "WHATSAPP", asLocale(locale));
  if (!tpl) return "";
  return fillTemplate(tpl.body, { businessName: settings.business.name, ...vars });
}

/** Notifies the business owner (admin email + in-app for all OWNER/ADMIN users). */
export async function notifyAdmins(key: TemplateKey, vars: Vars, link?: string) {
  const settings = await getSettings();
  const admins = await prisma.user.findMany({ where: { role: { in: ["OWNER", "ADMIN"] }, isActive: true }, select: { id: true, locale: true } });
  for (const a of admins) {
    await notify({ key, locale: a.locale, vars, userId: a.id, link });
  }
  if (settings.notifications.adminEmail) {
    await notify({ key, locale: "fr", vars, email: settings.notifications.adminEmail, link, ctaLabel: "Ouvrir" });
  }
}
