import { Trash2 } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteStatusAction } from "@/actions/admin/content";
import { Badge, Card, StatusBadge } from "@/components/ui/misc";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusForm } from "@/components/admin/content-forms";

export default async function Statuses({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "settings.manage");
  const statuses = await prisma.applicationStatus.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { applications: true } } } });
  return (
    <div className="max-w-5xl space-y-3">
      <AdminPageHeader title={t.admin.nav.statuses} />
      {statuses.map((s) => (
        <details key={s.id} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer items-center gap-3 px-5 py-3">
            <span className="w-8 text-xs text-slate-400">{s.sortOrder}</span>
            <StatusBadge label={tr(s.label, locale)} color={s.color} />
            <span className="flex-1 font-mono text-xs text-slate-400">{s.key}</span>
            <Badge>{t.statusKind[s.kind]}</Badge>{s.isInitial && <Badge tone="gold">{t.admin.content.initial}</Badge>}{!s.isActive && <Badge>off</Badge>}
            <span className="text-xs text-slate-500">{s._count.applications}</span>
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-5">
            <StatusForm s={s} locale={locale} t={t} />
            <ConfirmForm action={deleteStatusAction.bind(null, locale, s.id)} confirm={t.admin.content.deleteConfirm}><button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button></ConfirmForm>
          </div>
        </details>
      ))}
      <Card className="p-5"><h2 className="mb-4 font-semibold">+ {t.admin.content.new}</h2><StatusForm s={null} locale={locale} t={t} /></Card>
    </div>
  );
}
