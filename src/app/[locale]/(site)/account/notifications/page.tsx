import Link from "@/components/ui/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { markNotificationsReadAction } from "@/actions/account";
import { Card, CardHeader, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default async function MyNotifications({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Card>
      <CardHeader title={t.account.notifications} action={<form action={markNotificationsReadAction.bind(null, locale)}><Button size="sm" variant="outline">{t.account.markAllRead}</Button></form>} />
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className={n.readAt ? "px-5 py-4" : "bg-gold-50/40 px-5 py-4"}>
              <div className="flex items-start justify-between gap-3">
                <p className={n.readAt ? "font-medium text-slate-700" : "font-semibold text-navy-800"}>{n.title}</p>
                <span className="shrink-0 text-xs text-slate-400">{formatDate(n.createdAt, locale, true)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              {n.link && <Link href={n.link} className="mt-1 inline-block text-sm font-semibold text-navy-700">{t.common.view} →</Link>}
            </li>
          ))}
        </ul>
      ) : <div className="p-5"><EmptyState title={t.account.noNotifications} /></div>}
    </Card>
  );
}
