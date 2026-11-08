import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { toNumber, whatsappLink } from "@/lib/utils";
import { anonymizeCustomerAction, setCustomerActiveAction } from "@/actions/admin/crm";
import { Badge, Card, CardHeader, Flag, StatusBadge, Table } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Customer({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const tc = t.admin.customers;
  const me = await requireStaff(locale, "customers.view");
  const u = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      applications: { include: { country: true, status: true }, orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      payments: { where: { status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] } } },
      consents: { orderBy: { createdAt: "desc" }, take: 10 },
      tickets: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!u) notFound();
  const paid = u.payments.reduce((s, p) => s + toNumber(p.amount) - toNumber(p.refundedAmount), 0);
  const wa = whatsappLink(u.phone, `Bonjour ${u.firstName}, `);
  return (
    <div className="space-y-6">
      <AdminPageHeader title={`${u.firstName} ${u.lastName}`} description={`${tc.joined} ${formatDate(u.createdAt, locale)} · ${tc.totalPaid}: ${formatMAD(paid, locale)}`}
        actions={<>
          <a href={`mailto:${u.email}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm"><Mail className="h-4 w-4" />{u.email}</a>
          {u.phone && <a href={`tel:${u.phone}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm" dir="ltr"><Phone className="h-4 w-4" />{u.phone}</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>}
        </>} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={tc.applications} />
            <ul className="divide-y divide-slate-100">
              {u.applications.map((a) => (
                <li key={a.id}><Link href={`/${locale}/admin/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <Flag code={a.country.isoCode} className="h-5 w-7" /><span className="flex-1 text-sm"><span className="font-mono">{a.reference}</span> — {tr(a.country.name, locale)}</span>
                  {a.isDraft ? <Badge>{t.account.draft}</Badge> : <StatusBadge label={tr(a.status.label, locale)} color={a.status.color} />}
                </Link></li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={t.admin.nav.invoices} />
            <Table>
              <thead><tr><th>{t.account.invoiceNumber}</th><th>{t.common.date}</th><th>{t.common.total}</th><th>{t.common.status}</th></tr></thead>
              <tbody>{u.invoices.map((i) => <tr key={i.id}><td><Link className="font-mono text-navy-700 underline" href={`/${locale}/admin/invoices/${i.id}`}>{i.number}</Link></td><td>{formatDate(i.issueDate, locale)}</td><td>{formatMAD(toNumber(i.total), locale)}</td><td><Badge>{t.invoiceStatus[i.status]}</Badge></td></tr>)}</tbody>
            </Table>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5 text-sm">
            <dl className="space-y-2">
              <div><dt className="text-slate-500">{t.account.city}</dt><dd>{u.city || "—"}</dd></div>
              <div><dt className="text-slate-500">{t.account.address}</dt><dd>{u.address || "—"}</dd></div>
              <div><dt className="text-slate-500">{t.common.language}</dt><dd>{u.locale.toUpperCase()}</dd></div>
              <div><dt className="text-slate-500">WhatsApp / Marketing</dt><dd>{u.whatsappOptIn ? "✓" : "✗"} / {u.marketingOptIn ? "✓" : "✗"}</dd></div>
              <div><dt className="text-slate-500">{t.admin.users.lastLogin}</dt><dd>{formatDate(u.lastLoginAt, locale, true)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t.admin.compliance.consents} />
            <ul className="space-y-1 p-5 text-xs">{u.consents.map((c) => <li key={c.id}>{c.granted ? "✓" : "✗"} {c.type} v{c.version} · {formatDate(c.createdAt, locale, true)} · {c.context}</li>)}</ul>
          </Card>
          {can(me.role, "customers.manage") && (
            <Card className="space-y-4 p-5">
              <form action={setCustomerActiveAction.bind(null, locale, u.id, !u.isActive)}><Button variant="outline" size="sm">{u.isActive ? tc.deactivate : tc.activate}</Button></form>
              {can(me.role, "compliance.manage") && (
                <ActionForm action={anonymizeCustomerAction.bind(null, locale, u.id)} submitLabel={tc.anonymize} submitVariant="danger" submitSize="sm">
                  <p className="text-xs text-slate-500">{tc.anonymizeConfirm}</p>
                  <Input name="confirm" placeholder="ANONYMISE" />
                </ActionForm>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
