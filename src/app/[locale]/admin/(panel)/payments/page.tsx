import Link from "@/components/ui/link";
import { Download, Eye } from "lucide-react";
import type { PaymentStatus } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { refundPaymentAction, rejectPaymentAction, verifyPaymentAction } from "@/actions/admin/finance";
import { Alert, Badge, Card, EmptyState } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

const ST: PaymentStatus[] = ["AWAITING_VERIFICATION", "PENDING", "CONFIRMED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"];

export default async function Payments({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const tp = t.admin.payments;
  const me = await requireStaff(locale, "finance.view");
  const manage = can(me.role, "finance.manage");
  const status = ST.includes(sp.status as PaymentStatus) ? (sp.status as PaymentStatus) : undefined;
  const payments = await prisma.payment.findMany({ where: status ? { status } : {}, include: { user: true, invoice: true, refunds: true }, orderBy: { createdAt: "desc" }, take: 200 });
  const tone = { PENDING: "slate", AWAITING_VERIFICATION: "amber", CONFIRMED: "green", FAILED: "red", CANCELLED: "slate", REFUNDED: "blue", PARTIALLY_REFUNDED: "blue" } as const;
  return (
    <div>
      <AdminPageHeader title={tp.title} actions={<a href="/api/admin/export?type=payments" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold"><Download className="h-4 w-4" />CSV</a>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="?" className={cn("rounded-full px-3 py-1.5 text-sm", !status ? "bg-navy-800 text-white" : "bg-white")}>{t.common.all}</a>
        {ST.map((s) => <a key={s} href={`?status=${s}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === s ? "bg-navy-800 text-white" : "bg-white")}>{t.paymentStatus[s]}</a>)}
      </div>
      {manage && <Alert tone="warning" className="mb-4">{tp.manualWarning}</Alert>}
      {payments.length === 0 ? <EmptyState title={t.common.noResults} /> : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="font-mono text-xs">{p.reference}</span>
                <span className="text-lg font-bold text-navy-800">{formatMAD(toNumber(p.amount), locale)}</span>
                <Badge tone={tone[p.status]}>{t.paymentStatus[p.status]}</Badge>
                <span>{t.paymentMethod[p.method]} · {p.provider}</span>
                <Link href={`/${locale}/admin/customers/${p.userId}`} className="underline">{p.user.firstName} {p.user.lastName}</Link>
                {p.invoice && <Link href={`/${locale}/admin/invoices/${p.invoice.id}`} className="font-mono underline">{p.invoice.number}</Link>}
                <span className="text-xs text-slate-400">{formatDate(p.createdAt, locale, true)}</span>
                {p.proofDocumentId && <a href={`/api/documents/${p.proofDocumentId}?inline=1`} target="_blank" className="inline-flex items-center gap-1 text-navy-700 underline"><Eye className="h-4 w-4" />{tp.proof}</a>}
                {p.providerTxnId && <span className="text-xs text-slate-500">{tp.providerTxn}: {p.providerTxnId}</span>}
                {p.verificationNote && <span className="text-xs text-slate-500">“{p.verificationNote}”</span>}
              </div>
              {manage && ["AWAITING_VERIFICATION", "PENDING"].includes(p.status) && (
                <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                  <ActionForm action={verifyPaymentAction.bind(null, locale, p.id)} inline submitLabel={tp.verify} submitSize="sm" confirm={tp.manualWarning}>
                    <Input name="note" placeholder={tp.verifyNote} className="h-8 w-72" required />
                  </ActionForm>
                  <ActionForm action={rejectPaymentAction.bind(null, locale, p.id)} inline submitLabel={tp.rejectPayment} submitSize="sm" submitVariant="danger">
                    <Input name="note" placeholder={t.admin.applications.rejectReason} className="h-8 w-56" />
                  </ActionForm>
                </div>
              )}
              {manage && ["CONFIRMED", "PARTIALLY_REFUNDED"].includes(p.status) && (
                <details className="mt-3 border-t border-slate-100 pt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-slate-600">{tp.refund}</summary>
                  <ActionForm action={refundPaymentAction.bind(null, locale, p.id)} inline submitLabel={tp.refund} submitSize="sm" submitVariant="danger" className="mt-2">
                    <Input name="amount" type="number" step="0.01" max={toNumber(p.amount) - toNumber(p.refundedAmount)} placeholder={tp.refundAmount} className="h-8 w-36" required />
                    <Input name="reason" placeholder={tp.refundReason} className="h-8 w-60" required />
                    <Input name="reference" placeholder={tp.refundReference} className="h-8 w-44" />
                  </ActionForm>
                  {p.refunds.map((r) => <p key={r.id} className="mt-1 text-xs text-slate-500">↩ {formatMAD(toNumber(r.amount), locale)} — {r.reason} ({formatDate(r.createdAt, locale)})</p>)}
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
