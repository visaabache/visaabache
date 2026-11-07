import Link from "next/link";
import { Bell, FolderOpen, Receipt } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { ApplicationRow } from "@/components/account/application-row";

export default async function AccountHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const [apps, unpaid, unread, notifications] = await Promise.all([
    prisma.application.findMany({ where: { userId: user.id }, include: { country: true, status: true, documentRequests: { where: { status: "OPEN" } } }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.invoice.count({ where: { userId: user.id, status: { in: ["ISSUED", "PARTIALLY_PAID"] } } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const active = apps.filter((a) => !a.isDraft && ["OPEN", "WAITING_CUSTOMER"].includes(a.status.kind)).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t.account.activeApplications} value={active} icon={<FolderOpen className="h-5 w-5" />} href={`/${locale}/account/applications`} />
        <StatCard label={t.account.unpaidInvoices} value={unpaid} icon={<Receipt className="h-5 w-5" />} tone={unpaid ? "amber" : "green"} href={`/${locale}/account/invoices`} />
        <StatCard label={t.account.unreadNotifications} value={unread} icon={<Bell className="h-5 w-5" />} tone="gold" href={`/${locale}/account/notifications`} />
      </div>
      <Card>
        <CardHeader title={t.account.applications} action={<ButtonLink href={`/${locale}/apply`} size="sm">{t.account.newApplication}</ButtonLink>} />
        {apps.length ? (
          <ul className="divide-y divide-slate-100">{apps.map((a) => <ApplicationRow key={a.id} a={a} locale={locale} t={t} />)}</ul>
        ) : (
          <div className="p-5"><EmptyState title={t.account.noApplications}><ButtonLink href={`/${locale}/apply`}>{t.common.applyForAssistance}</ButtonLink></EmptyState></div>
        )}
      </Card>
      {notifications.length > 0 && (
        <Card>
          <CardHeader title={t.account.notifications} action={<Link href={`/${locale}/account/notifications`} className="text-sm font-medium text-navy-700">{t.common.seeAll}</Link>} />
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className="px-5 py-3">
                <Link href={n.link || "#"} className="block">
                  <p className={n.readAt ? "text-sm text-slate-600" : "text-sm font-semibold text-navy-800"}>{n.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(n.createdAt, locale, true)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="text-xs text-slate-500">{t.common.independentNotice}</p>
    </div>
  );
}
