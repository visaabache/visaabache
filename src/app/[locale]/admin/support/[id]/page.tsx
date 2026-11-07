import Link from "next/link";
import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { setTicketStatusAction, staffReplyTicketAction } from "@/actions/admin/crm";
import { Badge, Card, CardHeader } from "@/components/ui/misc";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";
import { cn } from "@/lib/utils";

export default async function AdminTicket({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  await requireStaff(locale, "support.manage");
  const tk = await prisma.ticket.findUnique({ where: { id }, include: { user: true, application: true, messages: { include: { author: true }, orderBy: { createdAt: "asc" } } } });
  if (!tk) notFound();
  return (
    <Card className="max-w-4xl">
      <CardHeader
        title={tk.subject}
        description={<><Link href={`/${locale}/admin/customers/${tk.userId}`} className="underline">{tk.user.firstName} {tk.user.lastName}</Link>{tk.application && <> · <Link className="font-mono underline" href={`/${locale}/admin/applications/${tk.application.id}`}>{tk.application.reference}</Link></>}</>}
        action={<div className="flex items-center gap-2"><Badge>{t.ticketStatus[tk.status]}</Badge><form action={setTicketStatusAction.bind(null, locale, tk.id, tk.status === "CLOSED" ? "OPEN" : "CLOSED")}><Button size="sm" variant="outline">{tk.status === "CLOSED" ? t.admin.support.reopen : t.admin.support.close}</Button></form></div>}
      />
      <div className="space-y-4 p-5">
        {tk.messages.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl p-4 text-sm", m.fromStaff ? "ms-auto bg-navy-800 text-white" : "bg-slate-100")}>
            <p className={cn("mb-1 text-xs font-semibold", m.fromStaff ? "text-gold-300" : "text-slate-500")}>{m.author ? `${m.author.firstName}` : "—"} · {formatDate(m.createdAt, locale, true)}</p>
            <p className="whitespace-pre-line">{m.body}</p>
          </div>
        ))}
        <ActionForm action={staffReplyTicketAction.bind(null, locale, tk.id)} submitLabel={t.account.reply} resetOnSuccess>
          <Textarea name="body" required rows={4} placeholder={t.admin.support.replyPlaceholder} />
        </ActionForm>
      </div>
    </Card>
  );
}
