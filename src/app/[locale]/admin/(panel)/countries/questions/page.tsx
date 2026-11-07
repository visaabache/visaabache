import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { QuestionEditor } from "@/components/admin/country-editors";

export default async function GlobalQuestions({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ edit?: string; add?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const items = await prisma.question.findMany({ where: { countryId: null }, orderBy: { sortOrder: "asc" } });
  return (<div className="max-w-5xl"><AdminPageHeader title={t.admin.content.questions} description={`${t.common.all} — ${t.admin.nav.countries}`} /><QuestionEditor countryId={null} items={items} locale={locale} t={t} state={{ editId: sp.edit, add: sp.add, base: `/${locale}/admin/countries/questions` }} /></div>);
}
