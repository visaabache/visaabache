import { Trash2 } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { deletePackageAction } from "@/actions/admin/content";
import { Alert, Badge, Card } from "@/components/ui/misc";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PackageForm } from "@/components/admin/content-forms";

export default async function Packages({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-5xl space-y-4">
      <AdminPageHeader title={t.admin.nav.packages} />
      <Alert tone="info">{t.pricing.officialFeesNote}</Alert>
      {packages.map((p) => (
        <details key={p.id} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 font-semibold">
            <span className="flex-1">{tr(p.name, locale)}</span>
            <span>{formatMAD(toNumber(p.price), locale)}</span>
            {p.isHighlighted && <Badge tone="gold">★</Badge>}{p.isPromotional && <Badge tone="red">{t.pricing.promo}</Badge>}{!p.isActive && <Badge>off</Badge>}
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-5">
            <PackageForm p={p} locale={locale} t={t} />
            <ConfirmForm action={deletePackageAction.bind(null, locale, p.id)} confirm={t.admin.content.deleteConfirm}><button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button></ConfirmForm>
          </div>
        </details>
      ))}
      <Card className="p-5"><h2 className="mb-4 font-semibold">+ {t.admin.content.new}</h2><PackageForm p={null} locale={locale} t={t} /></Card>
    </div>
  );
}
