"use server";
import { revalidatePath } from "next/cache";
import { Prisma, type ArticleCategory, type FaqScope, type LinkType, type PriceType, type QuestionType, type Region, type ServiceCategory, type StatusKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { assertPermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { bool, csv, date, int, loc, locList, money, str } from "@/lib/form-data";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

const J = (v: Prisma.InputJsonValue | null) => (v === null ? Prisma.DbNull : v);
const ok = (locale: string, extra: Partial<ActionState> = {}): ActionState => ({ ok: true, message: getDictionary(asLocale(locale)).common.saved, ...extra });
const err = (e: unknown): ActionState => {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Duplicate value (slug/code/key already used)." };
  console.error(e);
  return { error: e instanceof Error ? e.message : "Error" };
};
const refresh = () => revalidatePath("/", "layout");

// ───────────── Countries ─────────────
const REGIONS: Region[] = ["EUROPE", "NORTH_AMERICA", "ASIA", "OTHER"];

export async function saveCountryAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("content.manage");
  const name = loc(fd, "name");
  const region = str(fd, "region") as Region;
  if (!name || !REGIONS.includes(region)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = {
    slug: slugify(str(fd, "slug") || String((name as Record<string, string>).fr || "")),
    isoCode: str(fd, "isoCode").toUpperCase().slice(0, 2) || "UN",
    name,
    region,
    isSchengen: bool(fd, "isSchengen"),
    isActive: bool(fd, "isActive"),
    isPopular: bool(fd, "isPopular"),
    sortOrder: int(fd, "sortOrder"),
    summary: J(loc(fd, "summary")),
    eligibility: J(loc(fd, "eligibility")),
    procedure: J(loc(fd, "procedure")),
    appointmentInfo: J(loc(fd, "appointmentInfo")),
    processingInfo: J(loc(fd, "processingInfo")),
    officialFeesInfo: J(loc(fd, "officialFeesInfo")),
    importantNotes: J(loc(fd, "importantNotes")),
    seoTitle: J(loc(fd, "seoTitle")),
    seoDescription: J(loc(fd, "seoDescription")),
    verificationNote: str(fd, "verificationNote") || null,
    ...(bool(fd, "markVerified") ? { lastVerifiedAt: new Date() } : {}),
  };
  try {
    const c = id ? await prisma.country.update({ where: { id }, data }) : await prisma.country.create({ data });
    await audit(actor.id, id ? "country.updated" : "country.created", "Country", c.id, { verified: bool(fd, "markVerified") });
    refresh();
    return id ? ok(locale) : ok(locale, { redirectTo: `/${asLocale(locale)}/admin/countries/${c.id}` });
  } catch (e) {
    return err(e);
  }
}

export async function deleteCountryAction(locale: string, id: string) {
  const actor = await assertPermission("content.manage");
  const used = await prisma.application.count({ where: { countryId: id } });
  if (used) await prisma.country.update({ where: { id }, data: { isActive: false } });
  else await prisma.country.delete({ where: { id } });
  await audit(actor.id, used ? "country.deactivated" : "country.deleted", "Country", id);
  refresh();
}

export async function saveVisaTypeAction(locale: string, countryId: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const name = loc(fd, "name");
  const code = slugify(str(fd, "code")).replace(/-/g, "_");
  if (!name || !code) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = { code, name, description: J(loc(fd, "description")), processingInfo: J(loc(fd, "processingInfo")), officialFee: J(loc(fd, "officialFee")), isActive: bool(fd, "isActive"), sortOrder: int(fd, "sortOrder") };
  try {
    if (id) await prisma.visaType.update({ where: { id }, data });
    else await prisma.visaType.create({ data: { ...data, countryId } });
    refresh();
    return ok(locale);
  } catch (e) {
    return err(e);
  }
}

export async function deleteVisaTypeAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.visaType.delete({ where: { id } });
  refresh();
}

function readCondition(fd: FormData): Prisma.InputJsonValue | null {
  const question = str(fd, "condQuestion");
  if (!question) return null;
  const op = (str(fd, "condOp") || "eq") as "eq" | "neq" | "in" | "truthy";
  const raw = str(fd, "condValue");
  return { question, op, value: op === "in" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : raw };
}

export async function saveChecklistItemAction(locale: string, countryId: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const title = loc(fd, "title");
  if (!title) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = {
    title, description: J(loc(fd, "description")), required: bool(fd, "required"), visaTypeCodes: csv(fd, "visaTypeCodes"),
    condition: J(readCondition(fd)), sortOrder: int(fd, "sortOrder"), isActive: bool(fd, "isActive"),
  };
  if (id) await prisma.checklistItem.update({ where: { id }, data });
  else await prisma.checklistItem.create({ data: { ...data, countryId } });
  refresh();
  return ok(locale);
}

export async function deleteChecklistItemAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.checklistItem.delete({ where: { id } });
  refresh();
}

export async function copyChecklistAction(locale: string, countryId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const fromId = str(fd, "fromCountryId");
  const items = await prisma.checklistItem.findMany({ where: { countryId: fromId } });
  if (!items.length) return { error: getDictionary(asLocale(locale)).common.noResults };
  const max = (await prisma.checklistItem.aggregate({ where: { countryId }, _max: { sortOrder: true } }))._max.sortOrder ?? 0;
  await prisma.checklistItem.createMany({
    data: items.map((i, idx) => ({
      countryId, title: i.title as Prisma.InputJsonValue, description: (i.description ?? Prisma.DbNull) as Prisma.InputJsonValue, required: i.required,
      visaTypeCodes: i.visaTypeCodes, condition: (i.condition ?? Prisma.DbNull) as Prisma.InputJsonValue, sortOrder: max + idx + 1, isActive: i.isActive,
    })),
  });
  refresh();
  return ok(locale);
}

const QTYPES: QuestionType[] = ["SELECT", "YES_NO", "TEXT", "NUMBER", "DATE"];

function readOptions(fd: FormData): Prisma.InputJsonValue | null {
  const lines = str(fd, "options").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return lines.map((line) => {
    const [value, fr, ar, en] = line.split("|").map((s) => s.trim());
    return { value: slugify(value).replace(/-/g, "_") || value, label: { fr: fr || value, ar: ar || fr || value, en: en || fr || value } };
  });
}

export async function saveQuestionAction(locale: string, countryId: string | null, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const label = loc(fd, "label");
  const type = str(fd, "type") as QuestionType;
  const key = slugify(str(fd, "key")).replace(/-/g, "_");
  if (!label || !key || !QTYPES.includes(type)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = { key, label, help: J(loc(fd, "help")), type, options: J(readOptions(fd)), required: bool(fd, "required"), visaTypeCodes: csv(fd, "visaTypeCodes"), sortOrder: int(fd, "sortOrder"), isActive: bool(fd, "isActive") };
  try {
    if (id) await prisma.question.update({ where: { id }, data });
    else await prisma.question.create({ data: { ...data, countryId } });
    refresh();
    return ok(locale);
  } catch (e) {
    return err(e);
  }
}

export async function deleteQuestionAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.question.delete({ where: { id } });
  refresh();
}

const LINK_TYPES: LinkType[] = ["GOVERNMENT", "EMBASSY", "CONSULATE", "VISA_CENTER", "OTHER"];

export async function saveLinkAction(locale: string, countryId: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const label = loc(fd, "label");
  const url = str(fd, "url");
  const type = str(fd, "type") as LinkType;
  if (!label || !/^https:\/\/[^\s]+$/.test(url) || !LINK_TYPES.includes(type)) return { error: getDictionary(asLocale(locale)).common.invalidForm + " (https://…)" };
  const data = { label, url, type, sortOrder: int(fd, "sortOrder") };
  if (id) await prisma.officialLink.update({ where: { id }, data });
  else await prisma.officialLink.create({ data: { ...data, countryId } });
  refresh();
  return ok(locale);
}

export async function deleteLinkAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.officialLink.delete({ where: { id } });
  refresh();
}

// ───────────── FAQs (general / country / service) ─────────────
export async function saveFaqAction(locale: string, scope: FaqScope, parentId: string | null, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await assertPermission("content.manage");
  const question = loc(fd, "question");
  const answer = loc(fd, "answer");
  if (!question || !answer) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = { question, answer, sortOrder: int(fd, "sortOrder"), isPublished: bool(fd, "isPublished"), showOnHome: bool(fd, "showOnHome") };
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data: { ...data, scope, countryId: scope === "COUNTRY" ? parentId : null, serviceId: scope === "SERVICE" ? parentId : null } });
  refresh();
  return ok(locale);
}

export async function deleteFaqAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.faq.delete({ where: { id } });
  refresh();
}

// ───────────── Services & packages ─────────────
const CATS: ServiceCategory[] = ["VISA", "ADMINISTRATIVE", "TRAVEL", "STUDY"];
const PRICE_TYPES: PriceType[] = ["FIXED", "FROM", "QUOTE"];

export async function saveServiceAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("content.manage");
  const name = loc(fd, "name");
  const shortDescription = loc(fd, "shortDescription");
  const category = str(fd, "category") as ServiceCategory;
  const priceType = str(fd, "priceType") as PriceType;
  if (!name || !shortDescription || !CATS.includes(category) || !PRICE_TYPES.includes(priceType)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = {
    slug: slugify(str(fd, "slug") || String((name as Record<string, string>).fr)), category, icon: str(fd, "icon") || "file-text", name, shortDescription,
    description: J(loc(fd, "description")), features: J(locList(fd, "features")), disclaimer: J(loc(fd, "disclaimer")), priceType, price: money(fd, "price"),
    isActive: bool(fd, "isActive"), isFeatured: bool(fd, "isFeatured"), sortOrder: int(fd, "sortOrder"), seoTitle: J(loc(fd, "seoTitle")), seoDescription: J(loc(fd, "seoDescription")),
  };
  try {
    const s = id ? await prisma.service.update({ where: { id }, data }) : await prisma.service.create({ data });
    await audit(actor.id, id ? "service.updated" : "service.created", "Service", s.id);
    refresh();
    return id ? ok(locale) : ok(locale, { redirectTo: `/${asLocale(locale)}/admin/services/${s.id}` });
  } catch (e) {
    return err(e);
  }
}

export async function deleteServiceAction(locale: string, id: string) {
  const actor = await assertPermission("content.manage");
  const used = await prisma.inquiry.count({ where: { serviceId: id } });
  if (used) await prisma.service.update({ where: { id }, data: { isActive: false } });
  else await prisma.service.delete({ where: { id } });
  await audit(actor.id, "service.deleted", "Service", id);
  refresh();
}

export async function savePackageAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("content.manage");
  const name = loc(fd, "name");
  const price = money(fd, "price");
  if (!name || price == null) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const data = {
    slug: slugify(str(fd, "slug") || String((name as Record<string, string>).fr)), name, description: J(loc(fd, "description")), features: J(locList(fd, "features")),
    price, compareAtPrice: money(fd, "compareAtPrice"), countrySlugs: csv(fd, "countrySlugs"), isActive: bool(fd, "isActive"), isHighlighted: bool(fd, "isHighlighted"),
    isPromotional: bool(fd, "isPromotional"), promoEndsAt: date(fd, "promoEndsAt"), sortOrder: int(fd, "sortOrder"),
  };
  try {
    const p = id ? await prisma.package.update({ where: { id }, data }) : await prisma.package.create({ data });
    await audit(actor.id, id ? "package.updated" : "package.created", "Package", p.id, { price });
    refresh();
    return ok(locale, id ? {} : { redirectTo: `/${asLocale(locale)}/admin/packages` });
  } catch (e) {
    return err(e);
  }
}

export async function deletePackageAction(locale: string, id: string) {
  await assertPermission("content.manage");
  const used = await prisma.application.count({ where: { packageId: id } });
  if (used) await prisma.package.update({ where: { id }, data: { isActive: false } });
  else await prisma.package.delete({ where: { id } });
  refresh();
}

// ───────────── Statuses ─────────────
const KINDS: StatusKind[] = ["OPEN", "WAITING_CUSTOMER", "COMPLETED", "CANCELLED"];

export async function saveStatusAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("settings.manage");
  const label = loc(fd, "label");
  const kind = str(fd, "kind") as StatusKind;
  const key = slugify(str(fd, "key") || String((label as Record<string, string> | null)?.en || "")).replace(/-/g, "_");
  if (!label || !key || !KINDS.includes(kind)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const color = /^#[0-9a-fA-F]{6}$/.test(str(fd, "color")) ? str(fd, "color") : "#2f4f85";
  const isInitial = bool(fd, "isInitial");
  const data = { key, label, description: J(loc(fd, "description")), color, kind, sortOrder: int(fd, "sortOrder"), isInitial, isActive: bool(fd, "isActive"), notifyCustomer: bool(fd, "notifyCustomer") };
  try {
    if (isInitial) await prisma.applicationStatus.updateMany({ data: { isInitial: false } });
    const s = id ? await prisma.applicationStatus.update({ where: { id }, data }) : await prisma.applicationStatus.create({ data });
    await audit(actor.id, "status.saved", "ApplicationStatus", s.id);
    refresh();
    return ok(locale);
  } catch (e) {
    return err(e);
  }
}

export async function deleteStatusAction(locale: string, id: string) {
  await assertPermission("settings.manage");
  const used = await prisma.application.count({ where: { statusId: id } });
  if (used) await prisma.applicationStatus.update({ where: { id }, data: { isActive: false } });
  else await prisma.applicationStatus.delete({ where: { id } });
  refresh();
}

// ───────────── Articles ─────────────
const ACATS: ArticleCategory[] = ["VISA_INFO", "TRAVEL_ADVICE", "ADMIN_PROCEDURES", "OPPORTUNITIES"];

export async function saveArticleAction(locale: string, id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("content.manage");
  const title = loc(fd, "title");
  const content = loc(fd, "content");
  const category = str(fd, "category") as ArticleCategory;
  if (!title || !content || !ACATS.includes(category)) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  const isPublished = bool(fd, "isPublished");
  const existing = id ? await prisma.article.findUnique({ where: { id } }) : null;
  const cover = str(fd, "coverImageUrl");
  const data = {
    slug: slugify(str(fd, "slug") || String((title as Record<string, string>).fr)), category, title, content, excerpt: J(loc(fd, "excerpt")),
    coverImageUrl: /^https?:\/\//.test(cover) || cover.startsWith("/") ? cover : null, authorName: str(fd, "authorName") || "VISA ABACHE", tags: csv(fd, "tags"),
    isPublished, publishedAt: date(fd, "publishedAt") ?? (isPublished ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null),
    seoTitle: J(loc(fd, "seoTitle")), seoDescription: J(loc(fd, "seoDescription")),
  };
  try {
    const a = id ? await prisma.article.update({ where: { id }, data }) : await prisma.article.create({ data });
    await audit(actor.id, id ? "article.updated" : "article.created", "Article", a.id);
    refresh();
    return id ? ok(locale) : ok(locale, { redirectTo: `/${asLocale(locale)}/admin/articles/${a.id}` });
  } catch (e) {
    return err(e);
  }
}

export async function deleteArticleAction(locale: string, id: string) {
  await assertPermission("content.manage");
  await prisma.article.delete({ where: { id } });
  refresh();
}

// ───────────── Legal pages ─────────────
export async function saveLegalPageAction(locale: string, id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await assertPermission("content.manage");
  const title = loc(fd, "title");
  const content = loc(fd, "content");
  if (!title || !content) return { error: getDictionary(asLocale(locale)).common.invalidForm };
  await prisma.legalPage.update({ where: { id }, data: { title, content, version: str(fd, "version") || "1.0" } });
  await audit(actor.id, "legal.updated", "LegalPage", id);
  refresh();
  return ok(locale);
}

