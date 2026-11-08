import Link from "@/components/ui/link";
import type { TicketStatus } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export default async function SupportList({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireStaff(locale, "support.manage");
  const status = (["OPEN", "ANSWERED", "CLOSED"] as TicketStatus[]).includes(sp.status as TicketStatus) ? (sp.status as TicketStatus) : "OPEN";
  const tickets = await prisma.ticket.findMany({ where: { status }, include: { user: true, application: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <div>
      <AdminPageHeader title={t.admin.support.title} />
      <div className="mb-4 flex gap-2">
        {(["OPEN", "ANSWERED", "CLOSED"] as const).map((s) => <a key={s} href={`?status=${s}`} className={cn("rounded-full px-4 py-1.5 text-sm", status === s ? "bg-navy-800 text-white" : "bg-white")}>{t.ticketStatus[s]}</a>)}
      </div>
      <Card>
        {tickets.length ? (
          <ul className="divide-y divide-slate-100">
            {tickets.map((tk) => (
              <li key={tk.id}><Link href={`/${locale}/admin/support/${tk.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1"><p className="font-medium">{tk.subject}</p><p className="truncate text-sm text-slate-500">{tk.user.firstName} {tk.user.lastName} — {tk.messages[0]?.body}</p></div>
                {tk.application && <Badge>{tk.application.reference}</Badge>}
                <span className="text-xs text-slate-400">{formatDate(tk.updatedAt, locale, true)}</span>
              </Link></li>
            ))}
          </ul>
        ) : <div className="p-5"><EmptyState title={t.common.noResults} /></div>}
      </Card>
    </div>
  );
}
