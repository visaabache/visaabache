import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { deleteCollection, saveCollection } from "@/actions/admin/catalog";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";
import { ProductPicker } from "@/components/admin/ProductPicker";

type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;
const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export default async function EditCollection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.collection.findUnique({ where: { id }, include: { products: { orderBy: { sortOrder: "asc" } } } });
  if (!c) notFound();
  const products = await prisma.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, select: { id: true, sku: true, name: true, status: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } } });
  return (
    <>
      <PageHeader title={tr(c.name, "fr")} actions={<><a href={`/fr/collections/${c.slug}`} target="_blank" className="btn-outline btn-sm">View</a><ActionButton action={deleteCollection} fields={{ id: c.id }} variant="danger" confirm="Delete this collection? Products are kept.">Delete</ActionButton><Link href="/admin/collections" className="btn-outline btn-sm">All collections</Link></>} />
      <AdminForm action={saveCollection} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="productsSubmitted" value="1" />
        <div className="space-y-6">
          <Card title="Collection">
            <div className="space-y-4">
              <I18nField name="name" label="Name" value={c.name as I18n} required />
              <I18nField name="description" label="Description" value={c.description as I18n} multiline rows={2} />
              <I18nField name="badge" label="Badge (e.g. “-20%”, “New”, “Ramadan”)" value={c.badge as I18n} />
            </div>
          </Card>
          <Card title="Products">
            <ProductPicker products={products.map((p) => ({ id: p.id, sku: p.sku, name: tr(p.name, "fr"), image: p.images[0]?.url ?? null, draft: p.status !== "PUBLISHED" }))} selected={c.products.map((x) => x.productId)} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Field label="Slug"><input name="slug" defaultValue={c.slug} className="field font-mono text-sm" /></Field>
              <Field label="Cover image" hint="Optional: otherwise the first product photo"><input type="file" name="image" accept="image/*" className="text-sm" /></Field>
              <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={c.sortOrder} className="field" /></Field>
              <Field label="Starts" hint="Optional, for promotions"><input name="startsAt" type="datetime-local" defaultValue={local(c.startsAt)} className="field" /></Field>
              <Field label="Ends"><input name="endsAt" type="datetime-local" defaultValue={local(c.endsAt)} className="field" /></Field>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={c.isActive} className="h-4 w-4 accent-majorelle" />Active</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={c.featured} className="h-4 w-4 accent-majorelle" />Show on the homepage</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="isGift" defaultChecked={c.isGift} className="h-4 w-4 accent-majorelle" />Gift collection</label>
              </div>
              <SubmitButton>Save</SubmitButton>
            </div>
          </Card>
        </div>
      </AdminForm>
    </>
  );
}
