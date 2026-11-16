import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/admin/AdminNav";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  // Customers = everyone who ordered (guests included), grouped by email, plus registered accounts.
  const like = q?.trim() ? `%${q.trim()}%` : "%";
  const rows = await prisma.$queryRaw<{ email: string; name: string; phone: string; city: string; orders: bigint; spent: bigint; last: Date; account: boolean }[]>`
    SELECT o.email, max(o."firstName" || ' ' || o."lastName") AS name, max(o.phone) AS phone, max(o.city) AS city,
           count(*) AS orders, COALESCE(sum(o.total) FILTER (WHERE o.status NOT IN ('CANCELLED','RETURNED')), 0) AS spent, max(o."createdAt") AS last,
           bool_or(u.id IS NOT NULL) AS account
    FROM "Order" o LEFT JOIN "User" u ON u.email = o.email
    WHERE o.email ILIKE ${like} OR o."lastName" ILIKE ${like} OR o.phone ILIKE ${like}
    GROUP BY o.email ORDER BY last DESC LIMIT 300`;
  const accountsOnly = await prisma.user.findMany({ where: { role: "CUSTOMER", orders: { none: {} }, ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 100 });
  const date = new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" });
  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} buyers · ${accountsOnly.length} accounts without orders`} />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Email, name or phone" className="field max-w-sm py-2" /><button className="btn-outline btn-sm">Search</button></form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-charcoal-500"><tr>{["Customer", "Phone", "City", "Orders", "Spent", "Last order"].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-charcoal/5">
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="px-4 py-3"><a href={`/admin/orders?q=${encodeURIComponent(r.email)}`} className="font-semibold hover:underline">{r.name}</a><span className="block text-xs text-charcoal-500">{r.email}{r.account ? " · account" : " · guest"}</span></td>
                <td className="px-4 py-3" dir="ltr">{r.phone}</td>
                <td className="px-4 py-3">{r.city}</td>
                <td className="px-4 py-3">{Number(r.orders)}</td>
                <td className="px-4 py-3 font-semibold">{formatMoney(Number(r.spent), "fr")}</td>
                <td className="px-4 py-3 text-charcoal-600">{date.format(r.last)}</td>
              </tr>
            ))}
            {accountsOnly.map((u) => (
              <tr key={u.id} className="text-charcoal-500">
                <td className="px-4 py-3">{u.name}<span className="block text-xs">{u.email} · account</span></td>
                <td className="px-4 py-3" dir="ltr">{u.phone}</td><td className="px-4 py-3">{u.city}</td><td className="px-4 py-3">0</td><td className="px-4 py-3">—</td><td className="px-4 py-3">Joined {date.format(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
