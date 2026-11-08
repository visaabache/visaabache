import Link from "@/components/ui/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState, Table } from "@/components/ui/misc";

export default async function MyInvoices({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const invoices = await prisma.invoice.findMany({ where: { userId: user.id }, orderBy: { issueDate: "desc" } });
  const tone = { ISSUED: "amber", PARTIALLY_PAID: "blue", PAID: "green", CANCELLED: "slate" } as const;
  return (
    <Card>
      <CardHeader title={t.account.invoices} />
      {invoices.length ? (
        <Table>
          <thead><tr><th>{t.account.invoiceNumber}</th><th>{t.account.issueDate}</th><th>{t.common.total}</th><th>{t.account.balance}</th><th>{t.common.status}</th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td><Link href={`/${locale}/account/invoices/${i.id}`} className="font-mono font-semibold text-navy-700 underline">{i.number}</Link></td>
                <td>{formatDate(i.issueDate, locale)}</td>
                <td>{formatMAD(toNumber(i.total), locale)}</td>
                <td>{formatMAD(Math.max(0, toNumber(i.total) - toNumber(i.amountPaid)), locale)}</td>
                <td><Badge tone={tone[i.status]}>{t.invoiceStatus[i.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <div className="p-5"><EmptyState title={t.account.noInvoices} /></div>}
    </Card>
  );
}
