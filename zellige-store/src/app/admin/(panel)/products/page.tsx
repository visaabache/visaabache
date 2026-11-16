import Image from "next/image";
import Link from "next/link";
import type { Prisma, ProductStatus } from "@prisma/client";
import { Copy, Eye, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { categoryOptions } from "@/lib/admin-data";
import { deleteProduct, duplicateProduct, setProductStatus, toggleFeatured } from "@/actions/admin/products";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, Badge } from "@/components/admin/ui";
import { PRODUCT_TONE } from "@/components/admin/labels";

export const metadata = { title: "Products" };

type SP = { q?: string; status?: string; category?: string; stock?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { inventory } = await getSettings();
  const where: Prisma.ProductWhereInput = {};
  if (sp.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(sp.status)) where.status = sp.status as ProductStatus;
  else where.status = { not: "ARCHIVED" };
  if (sp.category) where.categoryId = sp.category;
  if (sp.stock === "low") where.OR = [{ stock: { lte: inventory.lowStockThreshold }, variants: { none: {} } }, { variants: { some: { isActive: true, stock: { lte: inventory.lowStockThreshold } } } }];
  if (sp.stock === "out") where.OR = [{ stock: 0, variants: { none: {} } }, { variants: { some: { isActive: true, stock: 0 } } }];
  if (sp.q?.trim()) {
    const ids = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Product" WHERE name::text ILIKE ${"%" + sp.q.trim() + "%"} OR sku ILIKE ${"%" + sp.q.trim() + "%"} LIMIT 500`;
    where.id = { in: ids.map((i) => i.id) };
  }
  const page = Math.max(1, Number(sp.page) || 1);
  const take = 50;
  const [total, products, cats, counts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: [{ updatedAt: "desc" }], skip: (page - 1) * take, take, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true, variants: { where: { isActive: true }, select: { stock: true } } } }),
    categoryOptions(),
    prisma.product.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch, page: undefined }).filter(([, v]) => v) as [string, string][]);
    return `/admin/products${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${count("PUBLISHED")} published · ${count("DRAFT")} drafts · ${count("ARCHIVED")} archived`}
        actions={<><Link href="/admin/products/import" className="btn-outline btn-sm">Import / export</Link><Link href="/admin/products/new" className="btn-primary btn-sm">+ Add product</Link></>}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {[["", "Active"], ["PUBLISHED", "Published"], ["DRAFT", "Drafts"], ["ARCHIVED", "Archived"]].map(([v, l]) => (
          <Link key={v} href={qs({ status: v })} className={`chip ${(sp.status || "") === v ? "chip-active" : "bg-white"}`}>{l}</Link>
        ))}
        <Link href={qs({ stock: sp.stock === "low" ? "" : "low" })} className={`chip ${sp.stock === "low" ? "chip-active" : "bg-white"}`}>Low stock</Link>
        <Link href={qs({ stock: sp.stock === "out" ? "" : "out" })} className={`chip ${sp.stock === "out" ? "chip-active" : "bg-white"}`}>Out of stock</Link>
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={sp.q} placeholder="Search name or SKU" className="field max-w-xs py-2" />
        <select name="category" defaultValue={sp.category || ""} className="field max-w-xs py-2">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button className="btn-outline btn-sm">Filter</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-charcoal-500">
            <tr>{["", "Product", "Category", "Price", "Stock", "Status", ""].map((h, i) => <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5">
            {products.map((p) => {
              const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
              const threshold = p.lowStockThreshold ?? inventory.lowStockThreshold;
              return (
                <tr key={p.id} className="hover:bg-ivory-100">
                  <td className="w-16 px-4 py-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-ivory-200">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</div>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{tr(p.name, "fr") || "(untitled)"}</Link>
                    <span className="block font-mono text-xs text-charcoal-500">{p.sku}{p.variants.length ? ` · ${p.variants.length} variants` : ""}</span>
                  </td>
                  <td className="px-4 py-2 text-charcoal-600">{p.category ? tr(p.category.name, "fr") : "—"}</td>
                  <td className="px-4 py-2">{formatMoney(p.price, "fr")}{p.compareAtPrice && <span className="block text-xs text-charcoal-400 line-through">{formatMoney(p.compareAtPrice, "fr")}</span>}</td>
                  <td className="px-4 py-2"><Badge tone={stock === 0 ? "red" : stock <= threshold ? "yellow" : "neutral"}>{stock}</Badge></td>
                  <td className="px-4 py-2"><Badge tone={PRODUCT_TONE[p.status]}>{p.status.toLowerCase()}</Badge>{p.featured && <Star className="ms-1.5 inline h-3.5 w-3.5 fill-saffron text-saffron" />}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`/fr/product/${p.slug}?preview=1`} target="_blank" className="rounded-lg p-2 hover:bg-charcoal/5" title="Preview"><Eye className="h-4 w-4" /></a>
                      <ActionButton action={toggleFeatured} fields={{ id: p.id }}>{p.featured ? "Unfeature" : "Feature"}</ActionButton>
                      {p.status !== "PUBLISHED" ? <ActionButton action={setProductStatus} fields={{ id: p.id, status: "PUBLISHED" }} variant="primary">Publish</ActionButton> : <ActionButton action={setProductStatus} fields={{ id: p.id, status: "DRAFT" }}>Unpublish</ActionButton>}
                      <ActionButton action={duplicateProduct} fields={{ id: p.id }}><Copy className="h-3.5 w-3.5" /></ActionButton>
                      {p.status === "ARCHIVED" ? <ActionButton action={deleteProduct} fields={{ id: p.id }} variant="danger" confirm="Delete this product permanently?">Delete</ActionButton> : <ActionButton action={setProductStatus} fields={{ id: p.id, status: "ARCHIVED" }} confirm="Archive this product? It disappears from the store.">Archive</ActionButton>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-10 text-center text-charcoal-500">No products match.</p>}
      </div>
      {total > take && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link className="btn-outline btn-sm" href={`${qs({})}${qs({}).includes("?") ? "&" : "?"}page=${page - 1}`}>Previous</Link>}
          <span>Page {page} / {Math.ceil(total / take)}</span>
          {page * take < total && <Link className="btn-outline btn-sm" href={`${qs({})}${qs({}).includes("?") ? "&" : "?"}page=${page + 1}`}>Next</Link>}
        </div>
      )}
    </>
  );
}
