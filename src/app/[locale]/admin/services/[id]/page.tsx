import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteServiceAction } from "@/actions/admin/content";
import { Card, CardHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/content-forms";
import { FaqEditor } from "@/components/admin/country-editors";

export default async function EditService({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const s = id === "new" ? null : await prisma.service.findUnique({ where: { id }, include: { faqs: { orderBy: { sortOrder: "asc" } } } });
  if (id !== "new" && !s) notFound();
  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader title={s ? tr(s.name, locale) : `${t.admin.nav.services} — ${t.admin.content.new}`} actions={s && <ConfirmForm action={deleteServiceAction.bind(null, locale, s.id)} confirm={t.admin.content.deleteConfirm}><Button variant="danger">{t.common.delete}</Button></ConfirmForm>} />
      <Card className="p-6"><ServiceForm s={s} locale={locale} t={t} /></Card>
      {s && <Card><CardHeader title={t.admin.content.faqs} /><div className="p-5"><FaqEditor scope="SERVICE" parentId={s.id} items={s.faqs} locale={locale} t={t} /></div></Card>}
    </div>
  );
}
