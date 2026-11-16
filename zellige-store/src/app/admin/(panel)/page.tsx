import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleDollarSign, Clock, Package, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import { lowStockItems } from "@/lib/admin-queries";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/AdminNav";
import { Badge, Card } from "@/components/admin/ui";
import { ORDER_LABEL, ORDER_TONE } from "@/components/admin/labels";

export const metadata = { title: "Dashboard" };

const mad = (c: number) => formatMoney(c, "fr");

export default async function Dashboard() {
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const since14 = new Date(Date.now() - 13 * 86400_000);
  since14.setHours(0, 0, 0, 0);
  const counted = { status: { notIn: ["CANCELLED", "RETURNED"] as ("CANCELLED" | "RETURNED")[] } };
  const [agg30, toProcess, recent, low, daily, productStats, incomplete, pendingReviews, settings] = await Promise.all([
    prisma.order.aggregate({ where: { ...counted, createdAt: { gte: since30 } }, _sum: { total: true }, _count: true }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    lowStockItems(8),
    prisma.$queryRaw<{ day: Date; total: bigint; n: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COALESCE(SUM(total), 0) AS total, COUNT(*) AS n
      FROM "Order" WHERE "createdAt" >= ${since14} AND status NOT IN ('CANCELLED', 'RETURNED')
      GROUP BY 1 ORDER BY 1`,
    prisma.product.groupBy({ by: ["status"], _count: true }),
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" }, OR: [{ images: { none: {} } }, { weightG: null }, { AND: [{ widthCm: null }, { heightCm: null }, { diameterCm: null }] }] },
      select: { id: true, sku: true, name: true, weightG: true, widthCm: true, heightCm: true, diameterCm: true, _count: { select: { images: true } } },
      take: 8,
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
    getSettings(),
  ]);

  const byDay = new Map(daily.map((d) => [d.day.toISOString().slice(0, 10), Number(d.total)]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since14.getTime() + i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" }), total: byDay.get(key) ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  const revenue = agg30._sum.total ?? 0;
  const published = productStats.find((s) => s.status === "PUBLISHED")?._count ?? 0;
  const setupMissing = [
    !settings.store.phone && "phone number",
    !settings.store.email && "contact email",
    !(settings.payments.rib || settings.payments.iban) && settings.payments.bankTransferEnabled && "bank details (RIB) for transfers",
    !process.env.CMI_CLIENT_ID && "CMI card payment credentials",
    !process.env.RESEND_API_KEY && "email sending (RESEND_API_KEY)",
  ].filter(Boolean) as string[];

  const kpis = [
    { label: "Revenue, last 30 days", value: mad(revenue), icon: CircleDollarSign },
    { label: "Orders, last 30 days", value: String(agg30._count), icon: ShoppingCart },
    { label: "Average order", value: agg30._count ? mad(Math.round(revenue / agg30._count)) : "—", icon: CircleDollarSign },
    { label: "To process", value: String(toProcess), icon: Clock, href: "/admin/orders?status=open" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`${published} published products`} actions={<Link href="/admin/products/new" className="btn-primary btn-sm">+ Add product</Link>} />

      {setupMissing.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-saffron/50 bg-saffron-50 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-saffron-700" />
          <p>
            <strong>Finish setting up:</strong> {setupMissing.join(", ")}. <Link href="/admin/settings" className="link font-semibold">Settings →</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <div className="card h-full p-5">
              <k.icon className="h-5 w-5 text-majorelle" />
              <p className="mt-3 text-2xl font-semibold">{k.value}</p>
              <p className="text-sm text-charcoal-500">{k.label}</p>
            </div>
          );
          return k.href ? <Link key={k.label} href={k.href}>{body}</Link> : <div key={k.label}>{body}</div>;
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Sales, last 14 days">
          <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Daily revenue chart">
            {days.map((d) => (
              <div key={d.key} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-majorelle/80 transition group-hover:bg-majorelle" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
                  <span className="pointer-events-none absolute -top-6 start-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-charcoal px-1.5 py-0.5 text-[10px] text-white group-hover:block">{mad(d.total)}</span>
                </div>
                <span className="text-[10px] text-charcoal-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Low stock" actions={<Link href="/admin/inventory" className="text-sm font-semibold text-majorelle">All</Link>}>
          {low.length === 0 ? <p className="text-sm text-charcoal-500">Nothing under its threshold.</p> : (
            <ul className="space-y-2.5 text-sm">
              {low.map((l) => (
                <li key={l.sku} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/products/${l.productId}`} className="min-w-0 truncate hover:underline">{tr(l.name, "fr")}{l.variant ? ` · ${tr(l.variant, "fr")}` : ""}</Link>
                  <Badge tone={l.stock === 0 ? "red" : "yellow"}>{l.stock}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Latest orders" actions={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-majorelle">All orders <ArrowRight className="h-4 w-4" /></Link>}>
          {recent.length === 0 ? <p className="text-sm text-charcoal-500">No orders yet.</p> : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-charcoal/5">
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td className="px-2 py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:underline">{o.number}</Link></td>
                      <td className="px-2 py-2.5">{o.firstName} {o.lastName}<span className="block text-xs text-charcoal-500">{o.city}</span></td>
                      <td className="px-2 py-2.5"><Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge></td>
                      <td className="px-2 py-2.5 text-end font-semibold">{mad(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Needs attention">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><Link href="/admin/reviews" className="hover:underline">Reviews awaiting moderation</Link><Badge tone={pendingReviews ? "yellow" : "neutral"}>{pendingReviews}</Badge></li>
            </ul>
          </Card>
          <Card title="Incomplete products">
            {incomplete.length === 0 ? <p className="text-sm text-charcoal-500">All products have photos, dimensions and weight.</p> : (
              <ul className="space-y-2.5 text-sm">
                {incomplete.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-start gap-2 hover:underline">
                      <Package className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" />
                      <span>{tr(p.name, "fr")}<span className="block text-xs text-charcoal-500">Missing: {[p._count.images === 0 && "photos", !p.weightG && "weight", !p.widthCm && !p.heightCm && !p.diameterCm && "dimensions"].filter(Boolean).join(", ")}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
