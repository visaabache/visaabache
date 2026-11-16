import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDict, isLocale, fmt } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { logout } from "@/actions/account";
import { ProfileForm } from "@/components/account/AuthForms";

export const metadata = { robots: { index: false } };

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/account/login`);
  const d = getDict(locale);
  const orders = await prisma.order.findMany({ where: { OR: [{ userId: user.id }, { email: user.email }] }, orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } });
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, { dateStyle: "medium", numberingSystem: "latn" });
  return (
    <div className="container py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold md:text-5xl">{d.account.title}</h1>
          <p className="mt-2 text-charcoal-600">{user.name} · {user.email}</p>
        </div>
        <form action={logout}><input type="hidden" name="locale" value={locale} /><button className="btn-outline btn-sm">{d.account.signOut}</button></form>
      </div>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">{d.account.orders}</h2>
          {orders.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-charcoal-600">{d.account.noOrders}</p><Link href={`/${locale}/shop`} className="btn-primary mt-4">{d.home.shopNow}</Link></div>
          ) : (
            <ul className="card divide-y divide-charcoal/10">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="flex-1">
                    <p className="font-mono font-semibold" dir="ltr">{o.number}</p>
                    <p className="text-sm text-charcoal-500">{fmt(d.account.orderedOn, { date: date.format(o.createdAt) })} · {o._count.items} {o._count.items > 1 ? d.cart.items : d.cart.item}</p>
                  </div>
                  <span className="rounded-full bg-majorelle-50 px-3 py-1 text-xs font-semibold text-majorelle">{d.order.statuses[o.status]}</span>
                  <span className="font-semibold">{formatMoney(o.total, locale)}</span>
                  <Link href={`/${locale}/order/${o.number}?t=${o.accessToken}`} className="btn-outline btn-sm">{d.account.view}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card h-fit p-6">
          <h2 className="mb-4 font-display text-2xl font-semibold">{d.account.profile}</h2>
          <ProfileForm user={user} />
          <Link href={`/${locale}/wishlist`} className="mt-6 block text-sm font-semibold text-majorelle">{d.wishlist.title} →</Link>
        </section>
      </div>
    </div>
  );
}
