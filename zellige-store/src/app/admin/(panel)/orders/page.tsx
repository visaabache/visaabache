import Link from "next/link";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/admin/AdminNav";
import { Badge } from "@/components/admin/ui";
import { METHOD_LABEL, ORDER_LABEL, ORDER_TONE, PAY_LABEL, PAY_TONE } from "@/components/admin/labels";

export const metadata = { title: "Orders" };

type SP = { q?: string; status?: string; payment?: string; page?: string };
const STATUSES = Object.keys(ORDER_LABEL) as OrderStatus[];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (sp.status === "open") where.status = { in: ["PENDING", "CONFIRMED", "PROCESSING"] };
  else if (sp.status && STATUSES.includes(sp.status as OrderStatus)) where.status = sp.status as OrderStatus;
  if (sp.payment && sp.payment in PAY_LABEL) where.paymentStatus = sp.payment as PaymentStatus;
  const q = sp.q?.trim();
  if (q) where.OR = [{ number: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\s/g, "") } }, { lastName: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }];
  const page = Math.max(1, Number(sp.page) || 1);
  const take = 50;
  const [total, orders, byStatus] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take, include: { _count: { select: { items: true } } } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const n = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const link = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([k, v]) => v && !(k === "page" && !patch.page)) as [string, string][]);
    return `/admin/orders${p.toString() ? `?${p}` : ""}`;
  };
  const date = new Intl.DateTimeFormat("fr-MA", { dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <PageHeader title="Orders" description={`${total} orders`} actions={<><a href="/api/admin/export?what=orders" className="btn-outline btn-sm">Export .xlsx</a><a href="/api/admin/export?what=orders&format=csv" className="btn-outline btn-sm">.csv</a></>} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={link({ status: undefined })} className={`chip ${!sp.status ? "chip-active" : "bg-white"}`}>All</Link>
        <Link href={link({ status: "open" })} className={`chip ${sp.status === "open" ? "chip-active" : "bg-white"}`}>To process ({n("PENDING") + n("CONFIRMED") + n("PROCESSING")})</Link>
        {STATUSES.map((s) => <Link key={s} href={link({ status: s })} className={`chip ${sp.status === s ? "chip-active" : "bg-white"}`}>{ORDER_LABEL[s]} ({n(s)})</Link>)}
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={q} placeholder="Number, name, email, phone, city" className="field max-w-sm py-2" />
        <select name="payment" defaultValue={sp.payment || ""} className="field max-w-[200px] py-2">
          <option value="">Any payment</option>
          {Object.entries(PAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-charcoal-500">
            <tr>{["Order", "Date", "Customer", "Delivery", "Payment", "Status", "Total"].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-ivory-100">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:underline">{o.number}</Link><span className="block text-xs text-charcoal-500">{o._count.items} items</span></td>
                <td className="px-4 py-3 text-charcoal-600">{date.format(o.createdAt)}</td>
                <td className="px-4 py-3">{o.firstName} {o.lastName}<span className="block text-xs text-charcoal-500" dir="ltr">{o.phone}</span></td>
                <td className="px-4 py-3">{o.city}{o.country !== "MA" && <span className="ms-1 text-xs font-semibold text-majorelle">{o.country}</span>}</td>
                <td className="px-4 py-3"><span className="block text-xs text-charcoal-500">{METHOD_LABEL[o.paymentMethod]}</span><Badge tone={PAY_TONE[o.paymentStatus]}>{PAY_LABEL[o.paymentStatus]}</Badge></td>
                <td className="px-4 py-3"><Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge></td>
                <td className="px-4 py-3 text-end font-semibold">{formatMoney(o.total, "fr")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-10 text-center text-charcoal-500">No orders.</p>}
      </div>
      {total > take && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link className="btn-outline btn-sm" href={link({ page: String(page - 1) })}>Previous</Link>}
          <span>Page {page} / {Math.ceil(total / take)}</span>
          {page * take < total && <Link className="btn-outline btn-sm" href={link({ page: String(page + 1) })}>Next</Link>}
        </div>
      )}
    </>
  );
}
