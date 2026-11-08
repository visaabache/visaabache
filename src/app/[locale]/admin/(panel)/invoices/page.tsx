import Link from "@/components/ui/link";
import { Download, Plus } from "lucide-react";
import type { InvoiceStatus } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { Badge, Card, EmptyState, Table } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export default async function Invoices({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireStaff(locale, "finance.view");
  const ST: InvoiceStatus[] = ["ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"];
  const status = ST.includes(sp.status as InvoiceStatus) ? (sp.status as InvoiceStatus) : undefined;
  const invoices = await prisma.invoice.findMany({ where: status ? { status } : {}, orderBy: { issueDate: "desc" }, take: 300 });
  const tone = { ISSUED: "amber", PARTIALLY_PAID: "blue", PAID: "green", CANCELLED: "slate" } as const;
  const outstanding = invoices.filter((i) => ["ISSUED", "PARTIALLY_PAID"].includes(i.status)).reduce((s, i) => s + toNumber(i.total) - toNumber(i.amountPaid), 0);
  return (
    <div>
      <AdminPageHeader
        title={t.admin.invoices.title}
        description={`${t.admin.invoices.outstanding}: ${formatMAD(outstanding, locale)}`}
        actions={<>
          <a href="/api/admin/export?type=invoices" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold"><Download className="h-4 w-4" />CSV</a>
          <ButtonLink href={`/${locale}/admin/invoices/new`} variant="navy"><Plus className="h-4 w-4" />{t.admin.invoices.new}</ButtonLink>
        </>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="?" className={cn("rounded-full px-3 py-1.5 text-sm", !status ? "bg-navy-800 text-white" : "bg-white")}>{t.common.all}</a>
        {ST.map((s) => <a key={s} href={`?status=${s}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === s ? "bg-navy-800 text-white" : "bg-white")}>{t.invoiceStatus[s]}</a>)}
      </div>
      <Card>
        {invoices.length ? (
          <Table>
            <thead><tr><th>{t.account.invoiceNumber}</th><th>{t.admin.invoices.customer}</th><th>{t.account.issueDate}</th><th>{t.account.dueDate}</th><th>{t.common.total}</th><th>{t.account.balance}</th><th>{t.common.status}</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td><Link href={`/${locale}/admin/invoices/${i.id}`} className="font-mono font-semibold text-navy-700 underline">{i.number}</Link></td>
                  <td>{i.billingName}</td>
                  <td>{formatDate(i.issueDate, locale)}</td>
                  <td className={i.dueDate && i.dueDate < new Date() && ["ISSUED", "PARTIALLY_PAID"].includes(i.status) ? "font-semibold text-red-600" : ""}>{formatDate(i.dueDate, locale)}</td>
                  <td>{formatMAD(toNumber(i.total), locale)}</td>
                  <td>{formatMAD(Math.max(0, toNumber(i.total) - toNumber(i.amountPaid)), locale)}</td>
                  <td><Badge tone={tone[i.status]}>{t.invoiceStatus[i.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><EmptyState title={t.account.noInvoices} /></div>}
      </Card>
    </div>
  );
}
