import "server-only";
import { prisma } from "./db";
import type { Locale } from "./i18n/config";
import { tr } from "./i18n/localized";

type QuestionRow = { key: string; label: unknown; help: unknown; type: string; options: unknown; required: boolean; visaTypeCodes: string[] };

export function mapQuestion(x: QuestionRow, locale: Locale) {
  return {
    key: x.key,
    label: tr(x.label, locale),
    help: tr(x.help, locale),
    type: x.type,
    required: x.required,
    visaTypeCodes: x.visaTypeCodes,
    options: Array.isArray(x.options) ? (x.options as { value: string; label: unknown }[]).map((o) => ({ value: o.value, label: tr(o.label, locale) })) : [],
  };
}

/** Questions + checklist rules of one destination, translated (loaded on demand by the wizard). */
export async function countryWizardExtra(slug: string, locale: Locale) {
  const c = await prisma.country.findFirst({
    where: { slug, isActive: true },
    include: {
      questions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      checklistItems: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!c) return null;
  return {
    questions: c.questions.map((q) => mapQuestion(q, locale)),
    checklist: c.checklistItems.map((i) => ({
      id: i.id, title: tr(i.title, locale), description: tr(i.description, locale), required: i.required, visaTypeCodes: i.visaTypeCodes,
      condition: i.condition, isActive: i.isActive, sortOrder: i.sortOrder,
    })),
  };
}
