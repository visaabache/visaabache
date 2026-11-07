import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { round2, toNumber } from "@/lib/utils";
import { Card, CardHeader, Table } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Reports({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ year?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const tr_ = t.admin.reports;
  await requireStaff(locale, "finance.view");
  const year = Number(sp.year) || new Date().getFullYear();
  const from = new Date(year, 0, 1);
  const to = new Date(year + 1, 0, 1);
  const [payments, refunds, invoices, apps] = await Promise.all([
    prisma.payment.findMany({ where: { confirmedAt: { gte: from, lt: to }, status: { in: ["CONFIRMED", "REFUNDED", "PARTIALLY_REFUNDED"] } } }),
    prisma.refund.findMany({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.invoice.findMany({ where: { issueDate: { gte: from, lt: to }, status: { not: "CANCELLED" } } }),
    prisma.application.groupBy({ by: ["countryId"], where: { isDraft: false, submittedAt: { gte: from, lt: to } }, _count: true }),
  ]);
  const countries = await prisma.country.findMany({ where: { id: { in: apps.map((a) => a.countryId) } } });
  const months = Array.from({ length: 12 }, (_, m) => {
    const inM = (d: Date | null) => !!d && d.getFullYear() === year && d.getMonth() === m;
    const revenue = round2(payments.filter((p) => inM(p.confirmedAt)).reduce((s, p) => s + toNumber(p.amount), 0));
    const ref = round2(refunds.filter((r) => inM(r.createdAt)).reduce((s, r) => s + toNumber(r.amount), 0));
    const invoiced = round2(invoices.filter((i) => inM(i.issueDate)).reduce((s, i) => s + toNumber(i.total), 0));
    return { m, revenue, ref, net: round2(revenue - ref), invoiced };
  });
  const tot = months.reduce((a, x) => ({ revenue: a.revenue + x.revenue, ref: a.ref + x.ref, net: a.net + x.net, invoiced: a.invoiced + x.invoiced }), { revenue: 0, ref: 0, net: 0, invoiced: 0 });
  const byMethod = Object.entries(payments.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.method]: (acc[p.method] || 0) + toNumber(p.amount) }), {}));
  const monthName = (m: number) => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(year, m, 1));
  return (
    <div className="space-y-6">
      <AdminPageHeader title={tr_.title} description={String(year)} actions={
        <form className="flex gap-2"><Input name="year" type="number" defaultValue={year} className="w-28" /><Button variant="navy">{t.common.filter}</Button>
          <a href={`/api/admin/export?type=payments&from=${year}-01-01&to=${year}-12-31T23:59:59`} className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">{tr_.exportCsv}</a></form>
      } />
      <Card>
        <Table>
          <thead><tr><th>{tr_.month}</th><th>{tr_.invoiced}</th><th>{tr_.revenue}</th><th>{tr_.refunds}</th><th>{tr_.net}</th></tr></thead>
          <tbody>
            {months.map((x) => <tr key={x.m}><td className="capitalize">{monthName(x.m)}</td><td>{formatMAD(x.invoiced, locale)}</td><td>{formatMAD(x.revenue, locale)}</td><td className="text-red-600">{x.ref ? `−${formatMAD(x.ref, locale)}` : "—"}</td><td className="font-semibold">{formatMAD(x.net, locale)}</td></tr>)}
            <tr className="bg-navy-50 font-bold"><td>{t.common.total}</td><td>{formatMAD(tot.invoiced, locale)}</td><td>{formatMAD(tot.revenue, locale)}</td><td>−{formatMAD(tot.ref, locale)}</td><td>{formatMAD(tot.net, locale)}</td></tr>
          </tbody>
        </Table>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card><CardHeader title={tr_.byMethod} /><Table><tbody>{byMethod.map(([m, v]) => <tr key={m}><td>{t.paymentMethod[m as keyof typeof t.paymentMethod]}</td><td className="text-end font-semibold">{formatMAD(round2(v), locale)}</td></tr>)}</tbody></Table></Card>
        <Card><CardHeader title={tr_.byDestination} /><Table><tbody>{apps.sort((a, b) => b._count - a._count).map((a) => <tr key={a.countryId}><td>{tr(countries.find((c) => c.id === a.countryId)?.name, locale)}</td><td className="text-end font-semibold">{a._count}</td></tr>)}</tbody></Table></Card>
      </div>
    </div>
  );
}
