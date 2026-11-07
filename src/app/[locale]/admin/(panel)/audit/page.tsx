import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, Table } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, Pagination } from "@/components/admin/page-header";

export default async function Audit({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const ta = t.admin.audit;
  await requireStaff(locale, "audit.view");
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.q ? { OR: [{ action: { contains: sp.q } }, { entityId: { contains: sp.q } }, { entityType: { contains: sp.q } }] } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { actor: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
    prisma.auditLog.count({ where }),
  ]);
  return (
    <div>
      <AdminPageHeader title={ta.title} />
      <Card className="mb-4 p-4"><form className="flex gap-2"><Input name="q" defaultValue={sp.q} className="max-w-sm" placeholder="document.accessed, payment…" /><Button variant="navy">{t.common.search}</Button></form></Card>
      <Card>
        <Table>
          <thead><tr><th>{t.common.date}</th><th>{ta.actor}</th><th>{ta.action}</th><th>{ta.entity}</th><th>{ta.ip}</th></tr></thead>
          <tbody>{logs.map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap text-xs">{formatDate(l.createdAt, locale, true)}</td>
              <td className="text-sm">{l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : "system"}</td>
              <td className="font-mono text-xs">{l.action}{l.metadata ? <p className="max-w-md truncate text-slate-400">{JSON.stringify(l.metadata)}</p> : null}</td>
              <td className="font-mono text-xs">{l.entityType} {l.entityId?.slice(0, 12)}</td>
              <td className="font-mono text-xs text-slate-400">{l.ip}</td>
            </tr>
          ))}</tbody>
        </Table>
        <Pagination page={page} pages={Math.ceil(total / 50)} href={(p) => `?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} />
      </Card>
    </div>
  );
}
