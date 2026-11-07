import Link from "next/link";
import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { cancelInvoiceAction, recordPaymentAction, sendInvoiceReminderAction } from "@/actions/admin/finance";
import { Badge, Card, CardHeader } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { InvoiceView } from "@/components/account/invoice-view";
import { PrintButton } from "@/components/account/print-button";

export default async function AdminInvoice({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const me = await requireStaff(locale, "finance.view");
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { payments: true, application: true } });
  if (!inv) notFound();
  const settings = await getSettings();
  const manage = can(me.role, "finance.manage");
  const open = ["ISSUED", "PARTIALLY_PAID"].includes(inv.status);
  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="no-print mb-4 flex flex-wrap gap-2">
          <PrintButton label={t.account.printInvoice} />
          {inv.application && <Link href={`/${locale}/admin/applications/${inv.application.id}`} className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">{inv.application.reference}</Link>}
        </div>
        <InvoiceView inv={inv} locale={locale} t={t} settings={settings} />
      </div>
      <div className="no-print space-y-6">
        <Card>
          <CardHeader title={t.admin.nav.payments} />
          <ul className="divide-y divide-slate-100 text-sm">
            {inv.payments.map((p) => <li key={p.id} className="flex justify-between px-5 py-3"><span>{formatDate(p.createdAt, locale)} · {t.paymentMethod[p.method]}</span><span>{formatMAD(toNumber(p.amount), locale)} <Badge>{t.paymentStatus[p.status]}</Badge></span></li>)}
          </ul>
        </Card>
        {manage && open && (
          <Card>
            <CardHeader title={t.admin.applications.recordPayment} />
            <div className="p-5">
              <ActionForm action={recordPaymentAction.bind(null, locale)} submitLabel={t.common.save} submitSize="sm">
                <input type="hidden" name="invoiceId" value={inv.id} />
                <div className="grid grid-cols-2 gap-2">
                  <Input name="amount" type="number" step="0.01" min="0.01" required defaultValue={Math.max(0, toNumber(inv.total) - toNumber(inv.amountPaid))} />
                  <Select name="method">{(["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const).map((m) => <option key={m} value={m}>{t.paymentMethod[m]}</option>)}</Select>
                </div>
                <Input name="providerTxnId" placeholder={t.admin.payments.providerTxn} />
                <Input name="note" placeholder={t.admin.payments.verifyNote} />
                <p className="text-xs text-amber-700">{t.admin.payments.manualWarning}</p>
              </ActionForm>
            </div>
          </Card>
        )}
        {manage && open && (
          <Card className="flex flex-wrap gap-2 p-5">
            <form action={sendInvoiceReminderAction.bind(null, locale, inv.id)}><Button size="sm" variant="outline">{t.admin.invoices.sendReminder}</Button></form>
            {!inv.payments.some((p) => p.status === "CONFIRMED") && (
              <ConfirmForm action={cancelInvoiceAction.bind(null, locale, inv.id)} confirm={t.admin.invoices.cancelInvoice + " ?"}><Button size="sm" variant="danger">{t.admin.invoices.cancelInvoice}</Button></ConfirmForm>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
