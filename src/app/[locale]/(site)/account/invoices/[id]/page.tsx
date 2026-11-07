import { notFound } from "next/navigation";
import { Landmark, Wallet } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatMAD, tr } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { cmiConfigured, getSettings } from "@/lib/settings";
import { invoiceBalance } from "@/lib/domain/invoices";
import { declareTransferAction } from "@/actions/account";
import { Alert, Card, CardHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { InvoiceView } from "@/components/account/invoice-view";
import { CardPayButton } from "@/components/account/payment-options";
import { PrintButton } from "@/components/account/print-button";

export default async function MyInvoice({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const inv = await prisma.invoice.findFirst({ where: { id, userId: user.id }, include: { payments: true } });
  if (!inv) notFound();
  const settings = await getSettings();
  const balance = invoiceBalance(inv);
  const payable = balance > 0 && ["ISSUED", "PARTIALLY_PAID"].includes(inv.status);
  const awaiting = inv.payments.some((p) => p.status === "AWAITING_VERIFICATION");
  const p = settings.payments;
  return (
    <div className="space-y-6">
      <div className="no-print flex justify-end"><PrintButton label={t.account.printInvoice} /></div>
      <InvoiceView inv={inv} locale={locale} t={t} settings={settings} />
      {payable && (
        <Card className="no-print">
          <CardHeader title={`${t.account.payInvoice} — ${formatMAD(balance, locale)}`} description={t.account.paymentPendingNotice} />
          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
            {awaiting && <Alert tone="info" className="lg:col-span-2">{t.account.proofSent}</Alert>}
            {p.cardEnabled && cmiConfigured() && (
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-navy-800">{t.account.payByCard}</h3>
                <p className="mb-4 mt-1 text-sm text-slate-500">{t.account.payByCardText}</p>
                <CardPayButton locale={locale} invoiceId={inv.id} label={`${t.account.pay} ${formatMAD(balance, locale)}`} />
              </div>
            )}
            {p.bankTransferEnabled && (
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-navy-800"><Landmark className="h-4 w-4" />{t.account.payByTransfer}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.account.payByTransferText}</p>
                <dl className="my-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
                  {p.bankName && <div><dt className="inline text-slate-500">{t.account.bank}: </dt><dd className="inline font-medium">{p.bankName}</dd></div>}
                  <div><dt className="inline text-slate-500">{t.account.beneficiary}: </dt><dd className="inline font-medium">{p.bankBeneficiary}</dd></div>
                  {p.bankRib && <div><dt className="inline text-slate-500">{t.account.rib}: </dt><dd className="inline font-mono font-medium" dir="ltr">{p.bankRib}</dd></div>}
                  {p.bankSwift && <div><dt className="inline text-slate-500">{t.account.swift}: </dt><dd className="inline font-mono">{p.bankSwift}</dd></div>}
                  <div><dt className="inline text-slate-500">{t.common.reference}: </dt><dd className="inline font-mono font-semibold">{inv.number}</dd></div>
                </dl>
                <p className="mb-3 text-xs text-slate-500">{tr(p.bankInstructions, locale)}</p>
                <ActionForm action={declareTransferAction.bind(null, locale, inv.id)} submitLabel={t.account.uploadProof} submitSize="sm">
                  <Field label={t.common.amount}><Input name="amount" type="number" step="0.01" min="1" defaultValue={balance} dir="ltr" /></Field>
                  <input type="file" name="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="block text-sm file:me-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2" />
                </ActionForm>
              </div>
            )}
            {p.cashEnabled && (
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-navy-800"><Wallet className="h-4 w-4" />{t.account.payInCash}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.account.payInCashText}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
