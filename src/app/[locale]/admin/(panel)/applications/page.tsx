import Link from "next/link";
import { Download, Paperclip } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { applicationWhere, type AppFilters } from "@/lib/admin-queries";
import { toNumber } from "@/lib/utils";
import { Badge, Card, EmptyState, Flag, StatusBadge, Table } from "@/components/ui/misc";
import { Input, Select, Checkbox } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, Pagination } from "@/components/admin/page-header";

export default async function AdminApplications({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<AppFilters & { page?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const ta = t.admin.applications;
  await requireStaff(locale, "applications.view");
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  const where = applicationWhere(sp);
  const [apps, total, statuses, countries] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { country: true, status: true, assignee: true, _count: { select: { documents: { where: { status: "PENDING_REVIEW", direction: "CUSTOMER_UPLOAD" } } } } },
      orderBy: [{ priority: "desc" }, { submittedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * per,
      take: per,
    }),
    prisma.application.count({ where }),
    prisma.applicationStatus.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.country.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    return p.toString();
  };
  const now = new Date();
  return (
    <div>
      <AdminPageHeader
        title={ta.title}
        description={`${total}`}
        actions={<a href={`/api/admin/export?type=applications&${qs({})}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50"><Download className="h-4 w-4" />{ta.export}</a>}
      />
      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <Input name="q" defaultValue={sp.q} placeholder={ta.search} className="w-full sm:w-72" />
          <Select name="status" defaultValue={sp.status || ""} className="w-auto">
            <option value="">{ta.allStatuses}</option>
            {statuses.map((s) => <option key={s.id} value={s.key}>{tr(s.label, locale)}</option>)}
          </Select>
          <Select name="country" defaultValue={sp.country || ""} className="w-auto">
            <option value="">{ta.destination}</option>
            {countries.map((c) => <option key={c.slug} value={c.slug}>{tr(c.name, locale)}</option>)}
          </Select>
          <Checkbox name="archived" value="1" defaultChecked={sp.archived === "1"} label={ta.showArchived} />
          <Checkbox name="drafts" value="1" defaultChecked={sp.drafts === "1"} label={ta.showDrafts} />
          <Button variant="navy">{t.common.filter}</Button>
          {Object.keys(sp).length > 0 && <Link href={`/${locale}/admin/applications`} className="text-sm text-slate-500 underline">{t.common.all}</Link>}
        </form>
      </Card>
      <Card>
        {apps.length ? (
          <Table>
            <thead><tr><th>{t.common.reference}</th><th>{ta.customer}</th><th>{ta.destination}</th><th>{t.common.status}</th><th>{ta.deadline}</th><th>{t.common.total}</th><th>{ta.submitted}</th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className={a.priority ? "bg-gold-50/40" : undefined}>
                  <td><Link href={`/${locale}/admin/applications/${a.id}`} className="font-mono font-semibold text-navy-700 hover:underline">{a.reference}</Link>{a.archivedAt && <Badge className="ms-2">{ta.archived}</Badge>}</td>
                  <td><p className="font-medium">{a.firstName} {a.lastName}</p><p className="text-xs text-slate-400">{a.email}</p></td>
                  <td><span className="flex items-center gap-2"><Flag code={a.country.isoCode} className="h-4 w-6" />{tr(a.country.name, locale)}</span></td>
                  <td>
                    <StatusBadge label={tr(a.status.label, locale)} color={a.status.color} />
                    {a._count.documents > 0 && <span className="ms-2 inline-flex items-center gap-0.5 text-xs text-amber-700"><Paperclip className="h-3 w-3" />{a._count.documents}</span>}
                  </td>
                  <td className={a.deadline && a.deadline < now ? "font-semibold text-red-600" : ""}>{a.deadline ? formatDate(a.deadline, locale) : "—"}</td>
                  <td>{formatMAD(toNumber(a.totalAmount), locale)}</td>
                  <td className="text-xs text-slate-500">{formatDate(a.submittedAt || a.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><EmptyState title={ta.nothingFound} /></div>}
        <Pagination page={page} pages={Math.ceil(total / per)} href={(p) => `?${qs({ page: p })}`} />
      </Card>
    </div>
  );
}
