"use server";
import { revalidatePath } from "next/cache";
import { Prisma, type DiscountType, type Role, type TestimonialSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { assertPermission } from "@/lib/auth/session";
import { hashPassword, isStrongPassword } from "@/lib/auth/password";
import { runAutomations } from "@/lib/domain/automation";
import { DEFAULT_SETTINGS, getSettings, saveSetting, type SettingsMap } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { bool, csv, date, int, loc, money, str } from "@/lib/form-data";
import { toWhatsAppNumber } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

const saved = (locale: string): ActionState => ({ ok: true, message: getDictionary(asLocale(locale)).common.saved });
const refresh = () => revalidatePath("/", "layout");
const L = (fd: FormData, k: string) => Object.fromEntries(locales.map((l) => [l, str(fd, `${k}.${l}`)]));

// ───────────── Testimonials ─────────────
export async function saveTestimonialAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("marketing.manage");
  const content = str(fd, "content").slice(0, 1500);
  const displayName = str(fd, "displayName").slice(0, 60);
  if (!content || !displayName) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const isVerified = bool(fd, "isVerified");
  const consent = bool(fd, "consentToPublish");
  // Never publish an unverified review or one without the client's consent.
  const isPublished = bool(fd, "isPublished") && isVerified && consent;
  const data = {
    displayName, content, city: str(fd, "city") || null, rating: Math.min(5, Math.max(1, int(fd, "rating", 5))), locale: str(fd, "locale") || "fr",
    source: (str(fd, "source") || "ADMIN_ENTERED") as TestimonialSource, consentToPublish: consent, isVerified, isPublished,
    verificationNote: str(fd, "verificationNote") || null,
  };
  if (id) {
    // Content written by a customer may not be altered by the admin: only moderation fields are editable.
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    const moderationOnly = existing?.source === "CUSTOMER_SUBMITTED";
    await prisma.testimonial.update({
      where: { id },
      data: moderationOnly ? { isVerified, isPublished: bool(fd, "isPublished") && isVerified && existing!.consentToPublish, verificationNote: data.verificationNote } : data,
    });
  } else await prisma.testimonial.create({ data });
  await audit(actor.id, "testimonial.saved", "Testimonial", id ?? undefined, { isPublished });
  refresh();
  return saved(locale);
}

export async function deleteTestimonialAction(locale: string, id: string) {
  await assertPermission("marketing.manage");
  await prisma.testimonial.delete({ where: { id } });
  refresh();
}

// ───────────── Banners ─────────────
export async function saveBannerAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("marketing.manage");
  const title = loc(fd, "title");
  if (!title) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const J = (v: Prisma.InputJsonValue | null) => (v === null ? Prisma.DbNull : v);
  const data = {
    title, text: J(loc(fd, "text")), ctaLabel: J(loc(fd, "ctaLabel")), ctaUrl: str(fd, "ctaUrl") || null, variant: str(fd, "variant") === "navy" ? "navy" : "gold",
    isActive: bool(fd, "isActive"), startsAt: date(fd, "startsAt"), endsAt: date(fd, "endsAt"),
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  refresh();
  return saved(locale);
}

export async function deleteBannerAction(locale: string, id: string) {
  await assertPermission("marketing.manage");
  await prisma.banner.delete({ where: { id } });
  refresh();
}

// ───────────── Discount codes ─────────────
export async function saveDiscountAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("marketing.manage");
  const code = str(fd, "code").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const type = str(fd, "type") as DiscountType;
  const value = money(fd, "value");
  if (!code || !["PERCENT", "FIXED"].includes(type) || value == null || (type === "PERCENT" && value > 100)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const maxUses = str(fd, "maxUses") ? int(fd, "maxUses") : null;
  const data = { code, type, value, description: str(fd, "description") || null, maxUses, minAmount: money(fd, "minAmount"), packageSlugs: csv(fd, "packageSlugs"), validFrom: date(fd, "validFrom"), validUntil: date(fd, "validUntil"), isActive: bool(fd, "isActive") };
  try {
    if (id) await prisma.discountCode.update({ where: { id }, data });
    else await prisma.discountCode.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Code already exists" };
    throw e;
  }
  await audit(actor.id, "discount.saved", "DiscountCode", code);
  revalidatePath(`/${asLocale(locale)}/admin/discounts`);
  return saved(locale);
}

export async function deleteDiscountAction(locale: string, id: string) {
  await assertPermission("marketing.manage");
  const used = await prisma.application.count({ where: { discountCodeId: id } });
  if (used) await prisma.discountCode.update({ where: { id }, data: { isActive: false } });
  else await prisma.discountCode.delete({ where: { id } });
  revalidatePath(`/${asLocale(locale)}/admin/discounts`);
}

// ───────────── Notification templates ─────────────
export async function saveTemplateAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("settings.manage");
  const body = str(fd, "body");
  if (!body) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  await prisma.notificationTemplate.update({ where: { id }, data: { subject: str(fd, "subject") || null, body: body.slice(0, 5000), isActive: bool(fd, "isActive") } });
  await audit(actor.id, "template.updated", "NotificationTemplate", id);
  return saved(locale);
}

// ───────────── Settings ─────────────
export async function saveSettingsAction(locale: string, section: keyof SettingsMap, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("settings.manage");
  const current = await getSettings();
  switch (section) {
    case "business":
      await saveSetting("business", {
        ...current.business, name: str(fd, "name") || "VISA ABACHE", legalName: str(fd, "legalName"), email: str(fd, "email"), phone: str(fd, "phone"),
        address: str(fd, "address"), city: str(fd, "city"), hours: L(fd, "hours"), ice: str(fd, "ice"), rc: str(fd, "rc"), ifNumber: str(fd, "ifNumber"),
        patente: str(fd, "patente"), cndpDeclaration: str(fd, "cndpDeclaration"), dpoEmail: str(fd, "dpoEmail"),
      });
      break;
    case "whatsapp":
      await saveSetting("whatsapp", { number: toWhatsAppNumber(str(fd, "number")), enabled: bool(fd, "enabled"), notifyCustomers: bool(fd, "notifyCustomers"), defaultMessage: L(fd, "defaultMessage") });
      break;
    case "payments":
      await saveSetting("payments", {
        ...current.payments, cardEnabled: bool(fd, "cardEnabled"), bankTransferEnabled: bool(fd, "bankTransferEnabled"), cashEnabled: bool(fd, "cashEnabled"),
        bankName: str(fd, "bankName"), bankBeneficiary: str(fd, "bankBeneficiary"), bankRib: str(fd, "bankRib"), bankSwift: str(fd, "bankSwift"),
        bankInstructions: L(fd, "bankInstructions"), invoicePrefix: str(fd, "invoicePrefix").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "VA",
        invoiceDueDays: Math.max(0, int(fd, "invoiceDueDays", 7)), vatRate: Math.min(30, Math.max(0, Number(str(fd, "vatRate")) || 0)), invoiceFooter: L(fd, "invoiceFooter"),
      });
      break;
    case "notifications":
      await saveSetting("notifications", {
        emailEnabled: bool(fd, "emailEnabled"), adminEmail: str(fd, "adminEmail"), notifyAdminOnNewApplication: bool(fd, "notifyAdminOnNewApplication"),
        notifyAdminOnNewInquiry: bool(fd, "notifyAdminOnNewInquiry"), paymentReminderDays: Math.max(1, int(fd, "paymentReminderDays", 3)),
        missingDocsReminderDays: Math.max(1, int(fd, "missingDocsReminderDays", 3)), maxReminders: Math.max(0, int(fd, "maxReminders", 3)),
      });
      break;
    case "retention":
      await saveSetting("retention", {
        archiveCompletedAfterDays: Math.max(1, int(fd, "archiveCompletedAfterDays", 30)), deleteDocumentsAfterDays: Math.max(0, int(fd, "deleteDocumentsAfterDays", 90)),
        deleteDraftsAfterDays: Math.max(1, int(fd, "deleteDraftsAfterDays", 30)), anonymizeInactiveCustomersAfterDays: Math.max(0, int(fd, "anonymizeInactiveCustomersAfterDays", 0)),
      });
      break;
    case "seo":
      await saveSetting("seo", {
        siteTitle: L(fd, "siteTitle"), siteDescription: L(fd, "siteDescription"), keywords: L(fd, "keywords"),
        gaMeasurementId: /^G-[A-Z0-9]+$/i.test(str(fd, "gaMeasurementId")) ? str(fd, "gaMeasurementId").toUpperCase() : "",
        googleSiteVerification: str(fd, "googleSiteVerification").replace(/[^A-Za-z0-9_-]/g, ""), ogImageUrl: str(fd, "ogImageUrl"),
        social: {
          facebook: str(fd, "social.facebook"), instagram: str(fd, "social.instagram"), tiktok: str(fd, "social.tiktok"),
          linkedin: str(fd, "social.linkedin"), youtube: str(fd, "social.youtube"),
        },
      });
      break;
    default:
      return { error: "Unknown section" };
  }
  await audit(actor.id, "settings.updated", "Setting", section);
  refresh();
  return saved(locale);
}

export async function resetSettingsSectionAction(locale: string, section: keyof SettingsMap) {
  await assertPermission("settings.manage");
  await saveSetting(section, DEFAULT_SETTINGS[section]);
  refresh();
}

// ───────────── Team & roles ─────────────
const STAFF_ROLES: Role[] = ["STAFF", "ADMIN", "OWNER"];

export async function createStaffAction(locale: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("users.manage");
  const t = getDictionary(asLocale(locale));
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") as Role;
  const password = str(fd, "password");
  if (!email || !STAFF_ROLES.includes(role) || !str(fd, "firstName")) return { error: t.common.invalidForm };
  if (!isStrongPassword(password)) return { error: t.auth.weakPassword };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Promote an existing account
    await prisma.user.update({ where: { id: existing.id }, data: { role } });
  } else {
    await prisma.user.create({ data: { email, role, firstName: str(fd, "firstName"), lastName: str(fd, "lastName"), passwordHash: await hashPassword(password), locale: "fr" } });
  }
  await audit(actor.id, "user.staff_created", "User", email, { role });
  revalidatePath(`/${asLocale(locale)}/admin/users`);
  return saved(locale);
}

export async function updateStaffAction(locale: string, userId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("users.manage");
  const role = str(fd, "role") as Role;
  if (![...STAFF_ROLES, "CUSTOMER"].includes(role)) return { error: "Invalid role" };
  if (userId === actor.id && role !== "OWNER") return { error: "You cannot downgrade your own account." };
  const owners = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const isActive = bool(fd, "isActive");
  if (target.role === "OWNER" && (role !== "OWNER" || !isActive) && owners <= 1) return { error: "At least one active owner is required." };
  await prisma.user.update({ where: { id: userId }, data: { role, isActive } });
  if (!isActive || role !== target.role) await prisma.session.deleteMany({ where: { userId } });
  await audit(actor.id, "user.role_changed", "User", userId, { from: target.role, to: role, isActive });
  revalidatePath(`/${asLocale(locale)}/admin/users`);
  return saved(locale);
}

// ───────────── Compliance ─────────────
export async function resolveDataRequestAction(locale: string, id: string, status: "COMPLETED" | "REJECTED", _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("compliance.manage");
  await prisma.dataRequest.update({ where: { id }, data: { status, response: str(fd, "response") || null, completedAt: new Date() } });
  await audit(actor.id, `privacy.request_${status.toLowerCase()}`, "DataRequest", id);
  revalidatePath(`/${asLocale(locale)}/admin/compliance`);
  return saved(locale);
}

// ───────────── Automation ─────────────
export async function runAutomationsAction(locale: string, _p: ActionState): Promise<ActionState> {
  const actor = await assertPermission("automation.run");
  const summary = await runAutomations("MANUAL");
  await audit(actor.id, "automation.manual_run", "AutomationRun", undefined, summary);
  revalidatePath(`/${asLocale(locale)}/admin/automation`);
  return { ok: true, message: Object.entries(summary).map(([k, v]) => `${k}: ${v}`).join(" · ") };
}
