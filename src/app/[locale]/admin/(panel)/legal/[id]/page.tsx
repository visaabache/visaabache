import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LegalForm } from "@/components/admin/content-forms";

export default async function EditLegal({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const p = await prisma.legalPage.findUnique({ where: { id } });
  if (!p) notFound();
  return <div className="max-w-5xl"><AdminPageHeader title={tr(p.title, locale)} /><Card className="p-6"><LegalForm p={p} locale={locale} t={t} /></Card></div>;
}
