import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { copyChecklistAction, deleteCountryAction } from "@/actions/admin/content";
import { Alert, Card, CardHeader, Flag } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ChecklistEditor, CountryForm, FaqEditor, LinkEditor, QuestionEditor, VisaTypeEditor } from "@/components/admin/country-editors";

export default async function EditCountry({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ edit?: string; add?: string }> }) {
  const { locale: l, id } = await params;
  const sp = await searchParams;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const tc = t.admin.content;
  await requireStaff(locale, "content.manage");
  const c = await prisma.country.findUnique({
    where: { id },
    include: {
      visaTypes: { orderBy: { sortOrder: "asc" } }, checklistItems: { orderBy: { sortOrder: "asc" } }, questions: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } }, faqs: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!c) notFound();
  const [globalQs, others] = await Promise.all([
    prisma.question.findMany({ where: { countryId: null }, orderBy: { sortOrder: "asc" } }),
    prisma.country.findMany({ where: { id: { not: id } }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const state = { editId: sp.edit, add: sp.add, base: `/${locale}/admin/countries/${id}` };
  const section = (sid: string, title: string, children: React.ReactNode, desc?: string) => (
    <Card id={sid} className="scroll-mt-20"><CardHeader title={title} description={desc} /><div className="p-5">{children}</div></Card>
  );
  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader
        title={<span className="flex items-center gap-3"><Flag code={c.isoCode} className="h-7 w-10" />{tr(c.name, locale)}</span>}
        actions={<>
          <a href={`/${locale}/visas/${c.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold"><ExternalLink className="h-4 w-4" />{t.common.view}</a>
          <ConfirmForm action={deleteCountryAction.bind(null, locale, c.id)} confirm={tc.deleteConfirm}><Button variant="danger">{t.common.delete}</Button></ConfirmForm>
        </>}
      />
      <nav className="flex flex-wrap gap-2 text-sm">
        {[["main", tc.name], ["types", tc.visaTypes], ["checklist", tc.checklist], ["questions", tc.questions], ["links", tc.links], ["faqs", tc.faqs]].map(([k, v]) => <a key={k} href={`#${k}`} className="rounded-full bg-white px-3 py-1 shadow-sm hover:bg-navy-50">{v}</a>)}
      </nav>
      {!c.lastVerifiedAt && <Alert tone="warning">{t.country.notVerified}</Alert>}
      {section("main", t.common.details, <CountryForm c={c} locale={locale} t={t} />)}
      {section("types", tc.visaTypes, <VisaTypeEditor countryId={c.id} items={c.visaTypes} locale={locale} t={t} state={state} />)}
      {section("checklist", tc.checklist, <>
        <ChecklistEditor countryId={c.id} items={c.checklistItems} questions={[...globalQs, ...c.questions]} locale={locale} t={t} state={state} />
        <div className="mt-4 border-t border-slate-100 pt-4">
          <ActionForm action={copyChecklistAction.bind(null, locale, c.id)} inline submitLabel={tc.copyChecklistFrom} submitSize="sm" submitVariant="outline">
            <Select name="fromCountryId" className="h-9 w-64">{others.map((o) => <option key={o.id} value={o.id}>{tr(o.name, locale)}</option>)}</Select>
          </ActionForm>
        </div>
      </>, t.country.checklistNote)}
      {section("questions", tc.questions, <QuestionEditor countryId={c.id} items={c.questions} locale={locale} t={t} state={state} />)}
      {section("links", tc.links, <LinkEditor countryId={c.id} items={c.links} locale={locale} t={t} state={state} />, t.country.officialLinksNote)}
      {section("faqs", tc.faqs, <FaqEditor scope="COUNTRY" parentId={c.id} items={c.faqs} locale={locale} t={t} state={state} />)}
    </div>
  );
}
