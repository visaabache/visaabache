import Link from "next/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createTicketAction } from "@/actions/account";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/misc";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";

export default async function Support({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const [tickets, apps] = await Promise.all([
    prisma.ticket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { messages: true } } } }),
    prisma.application.findMany({ where: { userId: user.id, isDraft: false }, include: { country: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const tone = { OPEN: "amber", ANSWERED: "green", CLOSED: "slate" } as const;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader title={t.account.support} />
        {tickets.length ? (
          <ul className="divide-y divide-slate-100">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link href={`/${locale}/account/support/${tk.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
                  <div><p className="font-medium text-navy-800">{tk.subject}</p><p className="text-xs text-slate-400">{formatDate(tk.updatedAt, locale, true)} · {tk._count.messages}</p></div>
                  <Badge tone={tone[tk.status]}>{t.ticketStatus[tk.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : <div className="p-5"><EmptyState title={t.account.noTickets} /></div>}
      </Card>
      <Card>
        <CardHeader title={t.account.newTicket} />
        <div className="p-5">
          <ActionForm action={createTicketAction.bind(null, locale)} submitLabel={t.common.send}>
            <Field label={t.account.subject} required><Input name="subject" required maxLength={160} /></Field>
            <Field label={t.account.relatedApplication}>
              <Select name="applicationId"><option value="">—</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.reference} — {tr(a.country.name, locale)}</option>)}</Select>
            </Field>
            <Field label={t.common.message} required><Textarea name="body" required rows={5} maxLength={5000} /></Field>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
