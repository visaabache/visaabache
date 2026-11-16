import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import { categoryOptions, collectionOptions } from "@/lib/admin-data";
import { centsToInput } from "@/lib/money";
import { deleteProduct, duplicateProduct } from "@/actions/admin/products";
import { PageHeader } from "@/components/admin/AdminNav";
import { ImageManager, ProductForm } from "@/components/admin/ProductForm";
import { ActionButton, Badge } from "@/components/admin/ui";
import { PRODUCT_TONE } from "@/components/admin/labels";

type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;
const J = (v: unknown) => (v ?? null) as I18n;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await prisma.product.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: p ? tr(p.name, "fr") : "Product" };
}

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const p = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } }, collections: true, _count: { select: { orderItems: true, reviews: true } } },
  });
  if (!p) notFound();
  const [categories, collections] = await Promise.all([categoryOptions(), collectionOptions()]);
  return (
    <>
      <PageHeader
        title={tr(p.name, "fr") || p.sku}
        description={`${p.sku} · ${p.salesCount} sold · ${p._count.reviews} reviews · ${formatMoney(p.price, "fr")}`}
        actions={
          <>
            <Badge tone={PRODUCT_TONE[p.status]}>{p.status.toLowerCase()}</Badge>
            <a href={`/fr/product/${p.slug}?preview=1`} target="_blank" className="btn-outline btn-sm">Preview FR</a>
            <a href={`/ar/product/${p.slug}?preview=1`} target="_blank" className="btn-outline btn-sm">AR</a>
            <a href={`/en/product/${p.slug}?preview=1`} target="_blank" className="btn-outline btn-sm">EN</a>
            <ActionButton action={duplicateProduct} fields={{ id: p.id }}>Duplicate</ActionButton>
            <ActionButton action={deleteProduct} fields={{ id: p.id }} variant="danger" confirm={p._count.orderItems ? "This product has orders: it will be archived instead." : "Delete this product permanently?"}>Delete</ActionButton>
            <Link href="/admin/products" className="btn-outline btn-sm">All products</Link>
          </>
        }
      />
      {created && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Product created. Add or reorder photos below, then publish when it is ready.</p>}
      <div className="space-y-6">
        <ImageManager productId={p.id} images={p.images.map((i) => ({ id: i.id, url: i.url, alt: J(i.alt) }))} />
        <ProductForm
          categories={categories}
          collections={collections}
          product={{
            id: p.id, sku: p.sku, slug: p.slug, status: p.status, name: J(p.name), shortDescription: J(p.shortDescription), description: J(p.description), materials: J(p.materials), care: J(p.care),
            craftType: p.craftType, craftNote: J(p.craftNote), seoTitle: J(p.seoTitle), seoDescription: J(p.seoDescription), price: p.price, compareAtPrice: p.compareAtPrice, stock: p.stock,
            lowStockThreshold: p.lowStockThreshold, widthCm: p.widthCm, heightCm: p.heightCm, depthCm: p.depthCm, diameterCm: p.diameterCm, capacityMl: p.capacityMl, weightG: p.weightG,
            colors: p.colors, patterns: p.patterns, featured: p.featured, giftable: p.giftable, personalizable: p.personalizable, categoryId: p.categoryId, collectionIds: p.collections.map((c) => c.collectionId),
            variants: p.variants.filter((v) => v.isActive || true).map((v) => ({ id: v.id, sku: v.sku, name: (v.name ?? {}) as { fr?: string; ar?: string; en?: string }, color: v.color, pattern: v.pattern, size: v.size, price: v.price ? centsToInput(v.price) : "", stock: v.stock, isActive: v.isActive })),
          }}
        />
      </div>
    </>
  );
}
