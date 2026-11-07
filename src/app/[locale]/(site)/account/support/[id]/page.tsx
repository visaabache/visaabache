import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { replyTicketAction } from "@/actions/account";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/misc";
import { Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { cn } from "@/lib/utils";

export default async function TicketPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" } }, application: true } });
  if (!ticket) notFound();
  return (
    <Card>
      <CardHeader title={ticket.subject} description={ticket.application?.reference} action={<Badge>{t.ticketStatus[ticket.status]}</Badge>} />
      <div className="space-y-4 p-5">
        {ticket.messages.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl p-4 text-sm", m.fromStaff ? "bg-navy-800 text-white" : "ms-auto bg-gold-50 text-slate-800")}>
            <p className={cn("mb-1 text-xs font-semibold", m.fromStaff ? "text-gold-300" : "text-gold-800")}>{m.fromStaff ? t.account.advisor : t.account.you} · {formatDate(m.createdAt, locale, true)}</p>
            <p className="whitespace-pre-line">{m.body}</p>
          </div>
        ))}
        {ticket.status === "CLOSED" ? <Alert tone="info">{t.account.ticketClosed}</Alert> : (
          <ActionForm action={replyTicketAction.bind(null, locale, ticket.id)} submitLabel={t.account.reply} resetOnSuccess>
            <Textarea name="body" required rows={3} maxLength={5000} aria-label={t.account.reply} />
          </ActionForm>
        )}
      </div>
    </Card>
  );
}
