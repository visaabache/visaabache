import type { ReactNode } from "react";
import Link from "@/components/ui/link";
import { Bell, FileText, FolderOpen, LayoutDashboard, LifeBuoy, LogOut, Receipt, UserRound, Wallet } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { fmt } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/actions/auth";
import { AccountNavLink } from "@/components/account/nav-link";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale, `/${locale}/account`);
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  const l = (p: string) => `/${locale}/account${p}`;
  const items = [
    { href: l(""), label: t.account.overview, icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
    { href: l("/applications"), label: t.account.applications, icon: <FolderOpen className="h-4 w-4" /> },
    { href: l("/invoices"), label: t.account.invoices, icon: <Receipt className="h-4 w-4" /> },
    { href: l("/payments"), label: t.account.payments, icon: <Wallet className="h-4 w-4" /> },
    { href: l("/notifications"), label: t.account.notifications, icon: <Bell className="h-4 w-4" />, badge: unread },
    { href: l("/support"), label: t.account.support, icon: <LifeBuoy className="h-4 w-4" /> },
    { href: l("/profile"), label: t.account.profile, icon: <UserRound className="h-4 w-4" /> },
  ];
  return (
    <div className="bg-slate-50">
      <div className="container grid grid-cols-1 gap-6 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="no-print">
          <div className="mb-4 rounded-2xl bg-navy-800 p-5 text-white">
            <p className="text-sm text-navy-200">{t.account.title}</p>
            <p className="font-semibold">{fmt(t.account.hello, { name: user.firstName })}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {items.map((i) => <AccountNavLink key={i.href} {...i} />)}
            <Link href={`/${locale}/apply`} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gold-700 hover:bg-gold-50"><FileText className="h-4 w-4" />{t.account.newApplication}</Link>
            <form action={logoutAction.bind(null, locale)}>
              <button className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white"><LogOut className="h-4 w-4" />{t.nav.logout}</button>
            </form>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
