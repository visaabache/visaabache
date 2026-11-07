import type { Invoice } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import type { SettingsMap } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import type { InvoiceItem } from "@/lib/domain/invoices";

export function InvoiceView({ inv, locale, t, settings }: { inv: Invoice; locale: Locale; t: Dictionary; settings: SettingsMap }) {
  const b = settings.business;
  const items = (inv.items as unknown as InvoiceItem[]) || [];
  const balance = Math.max(0, toNumber(inv.total) - toNumber(inv.amountPaid));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-soft print:border-0 print:p-0 print:shadow-none sm:p-10" id="invoice">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Logo />
          <div className="mt-3 space-y-0.5 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{b.legalName || b.name}</p>
            {b.address && <p>{b.address}</p>}
            <p>{b.city}</p>
            <p>{b.email} · <span dir="ltr">{b.phone}</span></p>
            {(b.ice || b.rc || b.ifNumber) && <p>{[b.ice && `ICE ${b.ice}`, b.rc && `RC ${b.rc}`, b.ifNumber && `IF ${b.ifNumber}`, b.patente && `TP ${b.patente}`].filter(Boolean).join(" · ")}</p>}
          </div>
        </div>
        <div className="text-end">
          <p className="text-2xl font-bold uppercase tracking-wide text-navy-800">{t.account.invoice}</p>
          <p className="font-mono text-slate-600">{inv.number}</p>
          <p className="mt-2 text-xs text-slate-500">{t.account.issueDate}: {formatDate(inv.issueDate, locale)}</p>
          {inv.dueDate && <p className="text-xs text-slate-500">{t.account.dueDate}: {formatDate(inv.dueDate, locale)}</p>}
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold">{t.invoiceStatus[inv.status]}</p>
        </div>
      </div>
      <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs">
        <p className="font-semibold text-slate-700">{inv.billingName}</p>
        <p>{inv.billingEmail}</p>
        {inv.billingPhone && <p dir="ltr">{inv.billingPhone}</p>}
        {inv.billingAddress && <p>{inv.billingAddress}</p>}
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="py-2 text-start">{t.admin.invoices.description}</th>
            <th className="py-2 text-end">{t.admin.invoices.quantity}</th>
            <th className="py-2 text-end">{t.admin.invoices.unitPrice}</th>
            <th className="py-2 text-end">{t.common.total}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-3 pe-4">{i.description}</td>
              <td className="py-3 text-end">{i.quantity}</td>
              <td className="py-3 text-end">{formatMAD(i.unitPrice, locale)}</td>
              <td className="py-3 text-end">{formatMAD(i.total, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ms-auto mt-6 w-full max-w-xs space-y-1.5">
        <div className="flex justify-between"><span className="text-slate-500">{t.apply.subtotal}</span><span>{formatMAD(toNumber(inv.subtotal), locale)}</span></div>
        {toNumber(inv.discount) > 0 && <div className="flex justify-between text-emerald-700"><span>{t.apply.discount}</span><span>−{formatMAD(toNumber(inv.discount), locale)}</span></div>}
        <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-navy-800"><span>{t.common.total}</span><span>{formatMAD(toNumber(inv.total), locale)}</span></div>
        <div className="flex justify-between text-slate-500"><span>{t.account.paid}</span><span>{formatMAD(toNumber(inv.amountPaid), locale)}</span></div>
        <div className="flex justify-between font-semibold"><span>{t.account.balance}</span><span>{formatMAD(balance, locale)}</span></div>
      </div>
      {settings.payments.vatRate === 0 && <p className="mt-6 text-xs text-slate-500">TVA non applicable / VAT not applicable.</p>}
      {inv.notes && <p className="mt-4 whitespace-pre-line text-xs text-slate-600">{inv.notes}</p>}
      <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-500">{tr(settings.payments.invoiceFooter, locale)}</p>
    </div>
  );
}
