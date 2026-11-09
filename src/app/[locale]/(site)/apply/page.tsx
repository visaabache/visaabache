import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr, trList } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { toNumber, toWhatsAppNumber } from "@/lib/utils";
import { ApplyWizard, type WizardData } from "@/components/apply/wizard";
import { countryWizardExtra, mapQuestion } from "@/lib/wizard-data";
import { customerAccountsEnabled } from "@/lib/features";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/apply", title: t.apply.title, description: t.apply.subtitle });
}

export default async function ApplyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ country?: string; type?: string; package?: string; draft?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const accounts = customerAccountsEnabled();
  const [countries, globalQs, packages, user, settings] = await Promise.all([
    prisma.country.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { visaTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.question.findMany({ where: { countryId: null, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    accounts ? getCurrentUser() : null,
    getSettings(),
  ]);

  let draft: WizardData["draft"] = null;
  if (sp.draft && user) {
    const a = await prisma.application.findFirst({
      where: { id: sp.draft, userId: user.id, isDraft: true },
      include: { country: true, visaType: true, documents: { select: { id: true, label: true, originalName: true, checklistItemId: true } } },
    });
    if (a) {
      const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
      draft = {
        id: a.id,
        country: a.country.slug,
        visaType: a.visaType?.code || "",
        details: {
          firstName: a.firstName, lastName: a.lastName, email: a.email, phone: a.phone, dateOfBirth: iso(a.dateOfBirth), nationality: a.nationality || "",
          passportNumber: a.passportNumber || "", passportExpiry: iso(a.passportExpiry), city: a.city || "", purpose: a.purpose || "",
          departureDate: iso(a.departureDate), returnDate: iso(a.returnDate), travelers: String(a.travelers), additionalInfo: a.additionalInfo || "",
        },
        answers: (a.answers as Record<string, string>) || {},
        documents: a.documents.map((d) => ({ id: d.id, label: d.label, name: d.originalName, checklistItemId: d.checklistItemId })),
      };
    }
  }

  const initialSlug = draft?.country || sp.country || "";
  const data: WizardData = {
    countries: countries.map((c) => ({
      slug: c.slug,
      name: tr(c.name, locale),
      iso: c.isoCode,
      region: c.region,
      visaTypes: c.visaTypes.map((v) => ({ code: v.code, name: tr(v.name, locale) })),
    })),
    globalQuestions: globalQs.map((x) => mapQuestion(x, locale)),
    initialExtra: initialSlug ? { [initialSlug]: await countryWizardExtra(initialSlug, locale) } : {},
    packages: packages
      .filter((p) => !p.isPromotional || !p.promoEndsAt || p.promoEndsAt > new Date())
      .map((p) => ({ slug: p.slug, name: tr(p.name, locale), description: tr(p.description, locale), price: toNumber(p.price), features: trList(p.features, locale), countrySlugs: p.countrySlugs, highlighted: p.isHighlighted })),
    user: user ? { email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone || "", city: user.city || "" } : null,
    initial: { country: sp.country || "", visaType: sp.type || "", package: sp.package || "" },
    whatsappNumber: settings.whatsapp.enabled ? toWhatsAppNumber(settings.whatsapp.number) : "",
    accounts,
    draft,
  };

  return (
    <section className="bg-slate-50 py-10 sm:py-14">
      <div className="container max-w-5xl">
        <h1 className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">{t.apply.title}</h1>
        <p className="mt-2 text-slate-600">{t.apply.subtitle}</p>
        <ApplyWizard locale={locale} data={data} t={{ apply: t.apply, common: t.common, auth: t.auth, regions: t.regions, country: t.country, legal: { terms: t.footer.terms, privacy: t.footer.privacy, refunds: t.footer.refunds } }} />
      </div>
    </section>
  );
}
