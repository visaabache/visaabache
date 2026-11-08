import Link from "@/components/ui/link";
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

export default async function Statuses({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ edit?: string; add?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireStaff(locale, "settings.manage");
  const statuses = await prisma.applicationStatus.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { applications: true } } } });
  const base = `/${locale}/admin/statuses`;
  return (
    <div className="max-w-5xl space-y-3">
      <AdminPageHeader title={t.admin.nav.statuses} />
      {statuses.map((s) => (
        <Card key={s.id} className={sp.edit === s.id ? "ring-2 ring-gold-300" : undefined}>
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span className="w-8 text-xs text-slate-400">{s.sortOrder}</span>
            <StatusBadge label={tr(s.label, locale)} color={s.color} />
            <span className="flex-1 font-mono text-xs text-slate-400">{s.key}</span>
            <Badge>{t.statusKind[s.kind]}</Badge>
            {s.isInitial && <Badge tone="gold">{t.admin.content.initial}</Badge>}
            {!s.isActive && <Badge>off</Badge>}
            <span className="text-xs text-slate-500">{s._count.applications}</span>
            <Link href={sp.edit === s.id ? base : `${base}?edit=${s.id}`} scroll={false} className="rounded-lg px-2 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50">
              {sp.edit === s.id ? t.common.close : t.common.edit}
            </Link>
          </div>
          {sp.edit === s.id && (
            <div className="space-y-3 border-t border-slate-100 p-5">
              <StatusForm s={s} locale={locale} t={t} />
              <ConfirmForm action={deleteStatusAction.bind(null, locale, s.id)} confirm={t.admin.content.deleteConfirm}>
                <button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button>
              </ConfirmForm>
            </div>
          )}
        </Card>
      ))}
      {sp.add ? (
        <Card className="p-5"><h2 className="mb-4 font-semibold">+ {t.admin.content.new}</h2><StatusForm s={null} locale={locale} t={t} /></Card>
      ) : (
        <Link href={`${base}?add=1`} scroll={false} className="inline-flex rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy-700">+ {t.admin.content.new}</Link>
      )}
    </div>
  );
}
