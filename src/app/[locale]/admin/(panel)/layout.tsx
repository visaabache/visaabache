import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AdminNav, type NavGroup } from "@/components/admin/nav";

export const metadata = { robots: { index: false, follow: false }, title: "Administration — VISA ABACHE" };

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireStaff(locale);
  const n = t.admin.nav;
  const [newApps, newInq, openTickets, toVerify] = await Promise.all([
    prisma.application.count({ where: { isDraft: false, archivedAt: null, status: { isInitial: true } } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.payment.count({ where: { status: "AWAITING_VERIFICATION" } }),
  ]);
  const a = (p: string) => `/${locale}/admin${p}`;
  const raw: { title: string; items: { href: string; label: string; icon: string; perm?: Permission; badge?: number; exact?: boolean }[] }[] = [
    { title: n.groupOperations, items: [
      { href: a(""), label: n.dashboard, icon: "dashboard", exact: true },
      { href: a("/applications"), label: n.applications, icon: "folder", perm: "applications.view", badge: newApps },
      { href: a("/customers"), label: n.customers, icon: "users", perm: "customers.view" },
      { href: a("/inquiries"), label: n.inquiries, icon: "inbox", perm: "inquiries.manage", badge: newInq },
      { href: a("/support"), label: n.support, icon: "message", perm: "support.manage", badge: openTickets },
    ] },
    { title: n.groupFinance, items: [
      { href: a("/payments"), label: n.payments, icon: "wallet", perm: "finance.view", badge: toVerify },
      { href: a("/invoices"), label: n.invoices, icon: "receipt", perm: "finance.view" },
      { href: a("/reports"), label: n.reports, icon: "chart", perm: "finance.view" },
    ] },
    { title: n.groupContent, items: [
      { href: a("/countries"), label: n.countries, icon: "globe", perm: "content.manage" },
      { href: a("/services"), label: n.services, icon: "briefcase", perm: "content.manage" },
      { href: a("/packages"), label: n.packages, icon: "package", perm: "content.manage" },
      { href: a("/statuses"), label: n.statuses, icon: "flag", perm: "settings.manage" },
      { href: a("/articles"), label: n.articles, icon: "book", perm: "content.manage" },
      { href: a("/faqs"), label: n.faqs, icon: "help", perm: "content.manage" },
      { href: a("/legal"), label: n.legal, icon: "scale", perm: "content.manage" },
    ] },
    { title: n.groupMarketing, items: [
      { href: a("/testimonials"), label: n.testimonials, icon: "star", perm: "marketing.manage" },
      { href: a("/banners"), label: n.banners, icon: "megaphone", perm: "marketing.manage" },
      { href: a("/discounts"), label: n.discounts, icon: "tag", perm: "marketing.manage" },
      { href: a("/templates"), label: n.templates, icon: "mail", perm: "settings.manage" },
    ] },
    { title: n.groupSystem, items: [
      { href: a("/settings"), label: n.settings, icon: "settings", perm: "settings.manage" },
      { href: a("/users"), label: n.users, icon: "shield", perm: "users.manage" },
      { href: a("/compliance"), label: n.compliance, icon: "lock", perm: "compliance.manage" },
      { href: a("/automation"), label: n.automation, icon: "zap", perm: "automation.run" },
      { href: a("/audit"), label: n.audit, icon: "list", perm: "audit.view" },
    ] },
  ];
  const groups: NavGroup[] = raw
    .map((g) => ({ title: g.title, items: g.items.filter((i) => !i.perm || can(user.role, i.perm)) }))
    .filter((g) => g.items.length);

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="no-print border-b border-slate-200 bg-navy-900 text-navy-100 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-0">
        <div className="flex items-center justify-between p-4 lg:p-5">
          <Link href={a("")}><Logo className="h-11" /></Link>
        </div>
        <AdminNav groups={groups} menuLabel={t.nav.menu} />
      </aside>
      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <p className="truncate text-sm text-slate-500"><span className="font-semibold text-navy-800">{user.firstName} {user.lastName}</span> · {t.admin.users.roles[user.role]}</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <Link href={`/${locale}/account/profile`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800" title={t.account.changePassword}><UserRound className="h-4 w-4" /><span className="hidden sm:inline">{t.account.profile}</span></Link>
            <Link href={`/${locale}`} target="_blank" className="hidden items-center gap-1 text-sm text-slate-600 hover:text-navy-800 sm:flex"><ExternalLink className="h-4 w-4" />{n.viewSite}</Link>
            <form action={logoutAction.bind(null, locale)}><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.nav.logout}><LogOut className="h-4 w-4" /></button></form>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
