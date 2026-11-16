import Image from "next/image";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { categoryOptions } from "@/lib/admin-data";
import { deleteCategory, saveCategory } from "@/actions/admin/catalog";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Badge, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

type Cat = Awaited<ReturnType<typeof load>>[number];
const load = () => prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }], include: { _count: { select: { products: true, children: true } } } });

function CategoryFields({ c, options }: { c?: Cat; options: { id: string; label: string }[] }) {
  type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <I18nField name="name" label="Name" value={(c?.name as I18n) ?? null} required />
      <Field label="Slug (URL)" hint="Latin letters, e.g. zellige-mugs"><input name="slug" defaultValue={c?.slug} className="field font-mono text-sm" /></Field>
      <Field label="Parent category">
        <select name="parentId" defaultValue={c?.parentId ?? ""} className="field">
          <option value="">— Top level —</option>
          {options.filter((o) => o.id !== c?.id).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="field" /></Field>
      <div className="md:col-span-2"><I18nField name="description" label="Description" value={(c?.description as I18n) ?? null} multiline rows={2} /></div>
      <Field label="Image (category card)"><input type="file" name="image" accept="image/*" className="text-sm" /></Field>
      <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} className="h-4 w-4 accent-majorelle" />Visible on the store</label>
    </div>
  );
}

export default async function CategoriesPage() {
  const [cats, options] = await Promise.all([load(), categoryOptions()]);
  const label = new Map(options.map((o) => [o.id, o.label]));
  const ordered = [...cats].sort((a, b) => (label.get(a.id) || "").localeCompare(label.get(b.id) || "", "fr"));
  return (
    <>
      <PageHeader title="Categories" description="Unlimited levels: set a parent to make a subcategory." />
      <Card title="Add a category" className="mb-6">
        <AdminForm action={saveCategory} resetOnSuccess className="space-y-4">
          <CategoryFields options={options} />
          <SubmitButton>Add category</SubmitButton>
        </AdminForm>
      </Card>
      <div className="card divide-y divide-charcoal/5">
        {ordered.map((c) => (
          <details key={c.id} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3 hover:bg-ivory-100">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ivory-200">{c.image && <Image src={c.image} alt="" fill sizes="40px" className="object-cover" />}</div>
              <div className="flex-1" style={{ paddingInlineStart: (label.get(c.id)!.split(" › ").length - 1) * 20 }}>
                <p className="font-semibold">{tr(c.name, "fr")} <span className="text-sm font-normal text-charcoal-400" dir="rtl">{(c.name as Record<string, string>).ar}</span></p>
                <p className="font-mono text-xs text-charcoal-500">/{c.slug}</p>
              </div>
              {!c.isActive && <Badge>hidden</Badge>}
              <Badge tone="blue">{c._count.products} products</Badge>
              <span className="text-sm text-majorelle group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-charcoal/5 bg-ivory-100 p-5">
              <AdminForm action={saveCategory} className="space-y-4">
                <CategoryFields c={c} options={options} />
                <SubmitButton>Save</SubmitButton>
              </AdminForm>
              <div className="mt-4 border-t border-charcoal/10 pt-4">
                <ActionButton action={deleteCategory} fields={{ id: c.id }} variant="danger" confirm="Delete this category? Its products and subcategories move to the parent category.">Delete category</ActionButton>
              </div>
            </div>
          </details>
        ))}
        {cats.length === 0 && <p className="p-8 text-center text-charcoal-500">No categories yet.</p>}
      </div>
    </>
  );
}
