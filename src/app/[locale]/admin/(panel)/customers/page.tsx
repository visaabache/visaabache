import Link from "@/components/ui/link";
import type { Prisma } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState, Table } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, Pagination } from "@/components/admin/page-header";

export default async function Customers({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const tc = t.admin.customers;
  await requireStaff(locale, "customers.view");
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 30;
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(sp.q ? { OR: [{ email: { contains: sp.q, mode: "insensitive" } }, { firstName: { contains: sp.q, mode: "insensitive" } }, { lastName: { contains: sp.q, mode: "insensitive" } }, { phone: { contains: sp.q } }] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * per, take: per, include: { _count: { select: { applications: { where: { isDraft: false } } } } } }),
    prisma.user.count({ where }),
  ]);
  return (
    <div>
      <AdminPageHeader title={tc.title} description={String(total)} />
      <Card className="mb-4 p-4">
        <form className="flex gap-3"><Input name="q" defaultValue={sp.q} placeholder={tc.search} className="max-w-sm" /><Button variant="navy">{t.common.search}</Button></form>
      </Card>
      <Card>
        {users.length ? (
          <Table>
            <thead><tr><th>{t.common.name}</th><th>{t.common.email}</th><th>{t.common.phone}</th><th>{tc.applications}</th><th>{tc.joined}</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><Link href={`/${locale}/admin/customers/${u.id}`} className="font-medium text-navy-700 hover:underline">{u.firstName} {u.lastName}</Link>{!u.isActive && <Badge tone="red" className="ms-2">off</Badge>}</td>
                  <td>{u.email}</td>
                  <td dir="ltr">{u.phone}</td>
                  <td>{u._count.applications}</td>
                  <td className="text-xs text-slate-500">{formatDate(u.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><EmptyState title={t.common.noResults} /></div>}
        <Pagination page={page} pages={Math.ceil(total / per)} href={(p) => `?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} />
      </Card>
    </div>
  );
}
