import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FaqEditor } from "@/components/admin/country-editors";

export default async function Faqs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ edit?: string; add?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const items = await prisma.faq.findMany({ where: { scope: "GENERAL" }, orderBy: { sortOrder: "asc" } });
  return <div className="max-w-5xl"><AdminPageHeader title={t.admin.nav.faqs} /><FaqEditor scope="GENERAL" parentId={null} items={items} locale={locale} t={t} state={{ editId: sp.edit, add: sp.add, base: `/${locale}/admin/faqs` }} /></div>;
}
