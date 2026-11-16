import Link from "next/link";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings";
import { lowStockItems } from "@/lib/admin-queries";
import { adjustStock } from "@/actions/admin/products";
import { PageHeader } from "@/components/admin/AdminNav";
import { AdminForm, Badge, Card } from "@/components/admin/ui";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { inventory } = await getSettings();
  const [low, products] = await Promise.all([
    lowStockItems(200),
    prisma.product.findMany({ where: { status: { not: "ARCHIVED" }, variants: { none: {} } }, orderBy: { stock: "asc" }, select: { id: true, sku: true, name: true, stock: true, lowStockThreshold: true } }),
  ]);
  return (
    <>
      <PageHeader title="Inventory" description={`Alert threshold: ${inventory.lowStockThreshold} (change in Settings, or per product)`} actions={<><a href="/api/admin/export?what=inventory" className="btn-outline btn-sm">Export .xlsx</a></>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Low stock alerts (${low.length})`}>
          {low.length === 0 ? <p className="text-sm text-charcoal-500">Everything is above its threshold.</p> : (
            <ul className="divide-y divide-charcoal/5 text-sm">
              {low.map((l) => (
                <li key={l.sku} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/products/${l.productId}`} className="hover:underline">{tr(l.name, "fr")}{l.variant ? ` · ${tr(l.variant, "fr")}` : ""}<span className="block font-mono text-xs text-charcoal-500">{l.sku}</span></Link>
                  <Badge tone={l.stock === 0 ? "red" : "yellow"}>{l.stock} / {l.threshold}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-charcoal-500">Variant stock is edited on the product page. An email alert goes to the inventory alert address after each order that drops an item to its threshold.</p>
        </Card>
        <Card title="Quick stock update (products without variants)">
          <ul className="divide-y divide-charcoal/5 text-sm">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{tr(p.name, "fr")}<span className="block font-mono text-xs text-charcoal-500">{p.sku}</span></span>
                <AdminForm action={adjustStock} className="flex shrink-0 items-center gap-2" successMessage="">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="stock" type="number" min={0} defaultValue={p.stock} className="w-20 rounded-lg border border-charcoal/15 px-2 py-1.5 text-sm" aria-label={`Stock for ${p.sku}`} />
                  <button className="btn-outline btn-sm">Set</button>
                </AdminForm>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
