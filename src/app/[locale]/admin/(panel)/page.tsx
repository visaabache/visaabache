import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle, Clock, FileSearch, FolderPlus, Hourglass, Inbox, MessagesSquare, TrendingUp, Wallet, Banknote } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { fmt, formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { addDays, round2, startOfMonth, toNumber } from "@/lib/utils";
import { Alert, Card, CardHeader, Flag, StatCard, StatusBadge } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function AdminDashboard({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ denied?: string }> }) {
  const locale = asLocale((await params).locale);
  const { denied } = await searchParams;
  const t = getDictionary(locale);
  const d = t.admin.dashboard;
  const user = await requireStaff(locale);
  const finance = can(user.role, "finance.view");
  const now = new Date();
  const a = (p: string) => `/${locale}/admin${p}`;
  const base = { isDraft: false, archivedAt: null };

  const [newReq, inProgress, waiting, overdue, docsToReview, newInq, openTickets, toVerify, deadlines, recent, settings, unverifiedCountries] = await Promise.all([
    prisma.application.count({ where: { ...base, status: { isInitial: true } } }),
    prisma.application.count({ where: { ...base, status: { kind: "OPEN", isInitial: false } } }),
    prisma.application.count({ where: { ...base, status: { kind: "WAITING_CUSTOMER" } } }),
    prisma.application.count({ where: { ...base, deadline: { lt: now }, status: { kind: { in: ["OPEN", "WAITING_CUSTOMER"] } } } }),
    prisma.document.count({ where: { status: "PENDING_REVIEW", direction: "CUSTOMER_UPLOAD", application: { isDraft: false } } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.payment.count({ where: { status: "AWAITING_VERIFICATION" } }),
    prisma.application.findMany({ where: { ...base, deadline: { not: null, lte: addDays(now, 14) }, status: { kind: { in: ["OPEN", "WAITING_CUSTOMER"] } } }, include: { country: true, status: true }, orderBy: { deadline: "asc" }, take: 8 }),
    prisma.application.findMany({ where: base, include: { country: true, status: true }, orderBy: { submittedAt: "desc" }, take: 8 }),
    getSettings(),
    prisma.country.count({ where: { isActive: true, lastVerifiedAt: null } }),
  ]);

  let revenueMonth = 0;
  let outstanding = 0;
  const months: { label: string; value: number }[] = [];
  if (finance) {
    const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));
    const [payments, refunds, unpaid] = await Promise.all([
      prisma.payment.findMany({ where: { status: { in: ["CONFIRMED", "REFUNDED", "PARTIALLY_REFUNDED"] }, confirmedAt: { gte: from } }, select: { amount: true, confirmedAt: true } }),
      prisma.refund.findMany({ where: { createdAt: { gte: from } }, select: { amount: true, createdAt: true } }),
      prisma.invoice.findMany({ where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } }, select: { total: true, amountPaid: true } }),
    ]);
    outstanding = round2(unpaid.reduce((s, i) => s + toNumber(i.total) - toNumber(i.amountPaid), 0));
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const inM = (dt: Date | null) => !!dt && dt >= m && dt < next;
      const value = round2(payments.filter((p) => inM(p.confirmedAt)).reduce((s, p) => s + toNumber(p.amount), 0) - refunds.filter((r) => inM(r.createdAt)).reduce((s, r) => s + toNumber(r.amount), 0));
      months.push({ label: new Intl.DateTimeFormat(locale, { month: "short" }).format(m), value });
    }
    revenueMonth = months[months.length - 1].value;
  }
  const max = Math.max(1, ...months.map((m) => m.value));

  const setup = [
    { done: settings.whatsapp.number !== "212600000000", label: d.setupWhatsapp, href: a("/settings#whatsapp") },
    { done: Boolean(settings.business.ice && settings.business.address), label: d.setupBusiness, href: a("/settings#business") },
    { done: Boolean(settings.payments.bankRib), label: d.setupBank, href: a("/settings#payments") },
    { done: unverifiedCountries === 0, label: `${d.setupVerify} (${unverifiedCountries})`, href: a("/countries") },
    { done: (process.env.EMAIL_DRIVER || "console") !== "console", label: d.setupEmail, href: a("/settings") },
  ];

  return (
    <div className="space-y-6">
      {denied && <Alert tone="error">{d.accessDenied}</Alert>}
      <AdminPageHeader title={fmt(d.welcome, { name: user.firstName })} description={d.subtitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={d.newRequests} value={newReq} icon={<FolderPlus className="h-5 w-5" />} tone="gold" href={a("/applications?status=new_request")} />
        <StatCard label={d.inProgress} value={inProgress} icon={<Clock className="h-5 w-5" />} href={a("/applications?kind=OPEN")} />
        <StatCard label={d.waitingCustomer} value={waiting} icon={<Hourglass className="h-5 w-5" />} tone="amber" href={a("/applications?kind=WAITING_CUSTOMER")} />
        <StatCard label={d.overdue} value={overdue} icon={<AlertTriangle className="h-5 w-5" />} tone={overdue ? "red" : "green"} href={a("/applications?overdue=1")} />
        <StatCard label={d.docsToReview} value={docsToReview} icon={<FileSearch className="h-5 w-5" />} href={a("/applications?docs=pending")} />
        <StatCard label={d.newInquiries} value={newInq} icon={<Inbox className="h-5 w-5" />} tone="gold" href={a("/inquiries")} />
        <StatCard label={d.openTickets} value={openTickets} icon={<MessagesSquare className="h-5 w-5" />} href={a("/support")} />
        {finance && <StatCard label={d.toVerify} value={toVerify} icon={<Wallet className="h-5 w-5" />} tone={toVerify ? "amber" : "green"} href={a("/payments?status=AWAITING_VERIFICATION")} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {finance && (
          <Card className="xl:col-span-2">
            <CardHeader title={d.revenueChart} />
            <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[200px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div><p className="flex items-center gap-1.5 text-sm text-slate-500"><TrendingUp className="h-4 w-4" />{d.revenueMonth}</p><p className="text-2xl font-bold text-navy-800">{formatMAD(revenueMonth, locale)}</p></div>
                <div><p className="flex items-center gap-1.5 text-sm text-slate-500"><Banknote className="h-4 w-4" />{d.outstanding}</p><p className="text-2xl font-bold text-amber-600">{formatMAD(outstanding, locale)}</p></div>
              </div>
              <div className="flex h-48 items-end gap-3" role="img" aria-label={d.revenueChart}>
                {months.map((m) => (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500">{m.value ? Math.round(m.value) : ""}</span>
                    <div className="w-full rounded-t-md bg-gradient-to-t from-navy-700 to-navy-500" style={{ height: `${Math.max(2, (m.value / max) * 150)}px` }} />
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
        <Card>
          <CardHeader title={d.setupChecklist} />
          <ul className="space-y-1 p-3">
            {setup.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-start gap-2.5 rounded-lg p-2 text-sm hover:bg-slate-50">
                  {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="h-5 w-5 shrink-0 text-amber-500" />}
                  <span className={s.done ? "text-slate-400 line-through" : "text-slate-700"}>{s.label}</span>
                </Link>
              </li>
            ))}
            {setup.every((s) => s.done) && <li className="p-2 text-sm font-medium text-emerald-700">{d.setupDone}</li>}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={d.recentApplications} action={<Link href={a("/applications")} className="text-sm font-medium text-navy-700">{t.common.seeAll}</Link>} />
          {recent.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={a(`/applications/${r.id}`)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <Flag code={r.country.isoCode} className="h-5 w-7" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.firstName} {r.lastName}</p><p className="font-mono text-xs text-slate-400">{r.reference} · {formatDate(r.submittedAt, locale)}</p></div>
                    <StatusBadge label={tr(r.status.label, locale)} color={r.status.color} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-slate-500">{d.nothing}</p>}
        </Card>
        <Card>
          <CardHeader title={d.upcomingDeadlines} />
          {deadlines.length ? (
            <ul className="divide-y divide-slate-100">
              {deadlines.map((r) => (
                <li key={r.id}>
                  <Link href={a(`/applications/${r.id}`)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className={r.deadline! < now ? "w-24 text-xs font-bold text-red-600" : "w-24 text-xs font-semibold text-amber-700"}>{formatDate(r.deadline, locale)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.firstName} {r.lastName} — {tr(r.country.name, locale)}</p><p className="font-mono text-xs text-slate-400">{r.reference}</p></div>
                    <StatusBadge label={tr(r.status.label, locale)} color={r.status.color} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-slate-500">{d.nothing}</p>}
        </Card>
      </div>
    </div>
  );
}
