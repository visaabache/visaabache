import Link from "next/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { Alert, Badge, Card, CardHeader, EmptyState, Table } from "@/components/ui/misc";

export default async function MyPayments({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ return?: string; ref?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const payments = await prisma.payment.findMany({ where: { userId: user.id }, include: { invoice: true, refunds: true }, orderBy: { createdAt: "desc" } });
  const tone = { PENDING: "slate", AWAITING_VERIFICATION: "amber", CONFIRMED: "green", FAILED: "red", CANCELLED: "slate", REFUNDED: "blue", PARTIALLY_REFUNDED: "blue" } as const;
  // The browser return from the gateway NEVER marks a payment as paid: we only display the real, server-side status.
  const returned = sp.ref ? payments.find((p) => p.reference === sp.ref) : null;
  return (
    <div className="space-y-6">
      {returned && (returned.status === "CONFIRMED" ? (
        <Alert tone="success">{t.paymentStatus.CONFIRMED} — {returned.reference}</Alert>
      ) : sp.return === "fail" || returned.status === "FAILED" ? (
        <Alert tone="error">{t.account.paymentReturnFailed}</Alert>
      ) : (
        <Alert tone="info">{t.account.paymentReturnPending}</Alert>
      ))}
      <Card>
        <CardHeader title={t.account.payments} description={t.account.paymentPendingNotice} />
        {payments.length ? (
          <Table>
            <thead><tr><th>{t.common.reference}</th><th>{t.common.date}</th><th>{t.common.amount}</th><th>{t.admin.payments.method}</th><th>{t.common.status}</th><th>{t.account.invoice}</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.reference}</td>
                  <td>{formatDate(p.createdAt, locale, true)}</td>
                  <td>{formatMAD(toNumber(p.amount), locale)}{toNumber(p.refundedAmount) > 0 && <span className="block text-xs text-sky-700">−{formatMAD(toNumber(p.refundedAmount), locale)}</span>}</td>
                  <td>{t.paymentMethod[p.method]}</td>
                  <td><Badge tone={tone[p.status]}>{t.paymentStatus[p.status]}</Badge></td>
                  <td>{p.invoice && <Link className="font-mono text-navy-700 underline" href={`/${locale}/account/invoices/${p.invoice.id}`}>{p.invoice.number}</Link>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><EmptyState title={t.account.noPayments} /></div>}
      </Card>
    </div>
  );
}
