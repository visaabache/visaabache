"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from "lucide-react";
import type { CraftType, ProductStatus } from "@prisma/client";
import { saveProduct, addProductImages, updateProductImage } from "@/actions/admin/products";
import { AdminForm, Card, Field, I18nField, SubmitButton } from "./ui";
import { CRAFT_LABEL, KNOWN_COLORS, KNOWN_PATTERNS } from "./labels";
import { centsToInput } from "@/lib/money";

type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;

export type ProductFormData = {
  id?: string;
  sku: string;
  slug: string;
  status: ProductStatus;
  name: I18n;
  shortDescription: I18n;
  description: I18n;
  materials: I18n;
  care: I18n;
  craftType: CraftType;
  craftNote: I18n;
  seoTitle: I18n;
  seoDescription: I18n;
  price: number | null;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  diameterCm: number | null;
  capacityMl: number | null;
  weightG: number | null;
  colors: string[];
  patterns: string[];
  featured: boolean;
  giftable: boolean;
  personalizable: boolean;
  categoryId: string | null;
  collectionIds: string[];
  variants: VariantRow[];
};

type VariantRow = { id?: string; sku: string; name: { fr?: string; ar?: string; en?: string }; color?: string | null; pattern?: string | null; size?: string | null; price?: string | null; stock: number; isActive: boolean };

function VariantEditor({ initial, baseSku }: { initial: VariantRow[]; baseSku: string }) {
  const [rows, setRows] = useState<VariantRow[]>(initial);
  const update = (i: number, patch: Partial<VariantRow>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const cell = "w-full rounded-lg border border-charcoal/15 bg-white px-2 py-1.5 text-sm";
  return (
    <div>
      <input type="hidden" name="variants" value={JSON.stringify(rows)} />
      {rows.length === 0 ? (
        <p className="text-sm text-charcoal-500">No variants: the product is sold as a single item with the stock above. Add variants for colours, patterns or sizes that have their own stock.</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-start text-xs text-charcoal-500">
              <tr>
                {["Name FR", "Name AR", "Name EN", "SKU", "Colour", "Pattern", "Size", "Price MAD", "Stock", "On", ""].map((h) => <th key={h} className="px-1 pb-2 text-start font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="p-1"><input className={cell} value={r.name.fr || ""} onChange={(e) => update(i, { name: { ...r.name, fr: e.target.value } })} required /></td>
                  <td className="p-1"><input className={cell} dir="rtl" value={r.name.ar || ""} onChange={(e) => update(i, { name: { ...r.name, ar: e.target.value } })} /></td>
                  <td className="p-1"><input className={cell} value={r.name.en || ""} onChange={(e) => update(i, { name: { ...r.name, en: e.target.value } })} /></td>
                  <td className="p-1"><input className={`${cell} font-mono uppercase`} value={r.sku} onChange={(e) => update(i, { sku: e.target.value.toUpperCase() })} required /></td>
                  <td className="p-1">
                    <select className={cell} value={r.color || ""} onChange={(e) => update(i, { color: e.target.value || null })}>
                      <option value="">—</option>
                      {KNOWN_COLORS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-1">
                    <select className={cell} value={r.pattern || ""} onChange={(e) => update(i, { pattern: e.target.value || null })}>
                      <option value="">—</option>
                      {KNOWN_PATTERNS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-1"><input className={cell} value={r.size || ""} onChange={(e) => update(i, { size: e.target.value })} /></td>
                  <td className="p-1"><input className={cell} inputMode="decimal" placeholder="same" value={r.price || ""} onChange={(e) => update(i, { price: e.target.value })} /></td>
                  <td className="p-1"><input className={cell} type="number" min={0} value={r.stock} onChange={(e) => update(i, { stock: Math.max(0, Number(e.target.value) || 0) })} /></td>
                  <td className="p-1 text-center"><input type="checkbox" checked={r.isActive} onChange={(e) => update(i, { isActive: e.target.checked })} className="h-4 w-4 accent-majorelle" /></td>
                  <td className="p-1"><button type="button" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} className="rounded-lg p-1.5 text-terracotta hover:bg-terracotta-50" aria-label="Remove variant"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => setRows((r) => [...r, { sku: `${baseSku || "SKU"}-${r.length + 1}`, name: {}, stock: 0, isActive: true }])} className="btn-outline btn-sm mt-3">
        <Plus className="h-4 w-4" /> Add variant
      </button>
    </div>
  );
}

function Checks({ name, options, selected, extraName }: { name: string; options: string[]; selected: string[]; extraName: string }) {
  const extra = selected.filter((s) => !options.includes(s));
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} className="peer sr-only" />
            <span className="chip bg-white text-xs peer-checked:border-majorelle peer-checked:bg-majorelle peer-checked:text-white">{o}</span>
          </label>
        ))}
      </div>
      <input name={extraName} defaultValue={extra.join(", ")} placeholder="Other values, comma separated" className="field mt-2 py-2 text-sm" />
    </div>
  );
}

export function ProductForm({ product, categories, collections }: { product: ProductFormData; categories: { id: string; label: string }[]; collections: { id: string; label: string }[] }) {
  const [craft, setCraft] = useState<CraftType>(product.craftType);
  const [sku, setSku] = useState(product.sku);
  const needsNote = craft === "ARTISAN_MADE" || craft === "HANDMADE_VERIFIED";
  return (
    <AdminForm action={saveProduct} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-6">
        <Card title="Product">
          <div className="space-y-5">
            <I18nField name="name" label="Name" value={product.name} required />
            <I18nField name="shortDescription" label="Short description (shown under the title, in cards and Google)" value={product.shortDescription} multiline rows={2} />
            <I18nField name="description" label="Full description" value={product.description} multiline rows={7} hint="Blank line = new paragraph. “## ” heading, “- ” list item, **bold**." />
          </div>
        </Card>

        {!product.id && (
          <Card title="Photos">
            <input type="file" name="images" accept="image/*" multiple className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-majorelle file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
            <p className="mt-2 text-xs text-charcoal-500">JPEG, PNG, WebP or HEIC, up to 15 MB each. The first photo is the main one; you can reorder after saving.</p>
          </Card>
        )}

        <Card title="Price and stock">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Price (MAD) *"><input name="price" required inputMode="decimal" defaultValue={centsToInput(product.price)} className="field" /></Field>
            <Field label="Compare-at price (MAD)" hint="Shown struck through: makes it a sale"><input name="compareAtPrice" inputMode="decimal" defaultValue={centsToInput(product.compareAtPrice)} className="field" /></Field>
            <Field label="Stock" hint="Ignored when the product has variants"><input name="stock" type="number" min={0} defaultValue={product.stock} className="field" /></Field>
            <Field label="Low-stock alert at" hint="Empty = store default"><input name="lowStockThreshold" type="number" min={0} defaultValue={product.lowStockThreshold ?? ""} className="field" /></Field>
          </div>
        </Card>

        <Card title="Variants (colours, patterns, sizes)">
          <VariantEditor initial={product.variants} baseSku={sku} />
        </Card>

        <Card title="Dimensions and weight">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Width (cm)"><input name="widthCm" inputMode="decimal" defaultValue={product.widthCm ?? ""} className="field" /></Field>
            <Field label="Height (cm)"><input name="heightCm" inputMode="decimal" defaultValue={product.heightCm ?? ""} className="field" /></Field>
            <Field label="Depth (cm)"><input name="depthCm" inputMode="decimal" defaultValue={product.depthCm ?? ""} className="field" /></Field>
            <Field label="Diameter (cm)"><input name="diameterCm" inputMode="decimal" defaultValue={product.diameterCm ?? ""} className="field" /></Field>
            <Field label="Capacity (ml)"><input name="capacityMl" type="number" min={0} defaultValue={product.capacityMl ?? ""} className="field" /></Field>
            <Field label="Weight (g)" hint="Used for international rates"><input name="weightG" type="number" min={0} defaultValue={product.weightG ?? ""} className="field" /></Field>
          </div>
        </Card>

        <Card title="Materials, care and craft">
          <div className="space-y-5">
            <I18nField name="materials" label="Materials and finish" value={product.materials} multiline rows={2} />
            <I18nField name="care" label="Care instructions" value={product.care} multiline rows={2} />
            <Field label="How it is made (shown to customers)">
              <select name="craftType" value={craft} onChange={(e) => setCraft(e.target.value as CraftType)} className="field">
                {(Object.keys(CRAFT_LABEL) as CraftType[]).map((c) => <option key={c} value={c}>{CRAFT_LABEL[c]}</option>)}
              </select>
            </Field>
            {needsNote && (
              <div className="rounded-xl border border-saffron/50 bg-saffron-50 p-4">
                <I18nField name="craftNote" label="Craft note: who made it, where, and how you verified it" value={product.craftNote} multiline rows={3} required />
              </div>
            )}
            {!needsNote && <p className="text-xs text-charcoal-500">Only choose “Made by artisans” or “Handmade (verified)” when you can document it (workshop, city, how you checked). The site never claims more than this setting.</p>}
          </div>
        </Card>

        <Card title="Search engines (optional)">
          <div className="space-y-5">
            <I18nField name="seoTitle" label="Page title" value={product.seoTitle} hint="Defaults to the product name" />
            <I18nField name="seoDescription" label="Meta description" value={product.seoDescription} multiline rows={2} hint="Defaults to the short description" />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Field label="Status">
              <select name="status" defaultValue={product.status} className="field">
                <option value="DRAFT">Draft: hidden, preview only</option>
                <option value="PUBLISHED">Published: live on the store</option>
                <option value="ARCHIVED">Archived: hidden</option>
              </select>
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <SubmitButton>Save</SubmitButton>
              {product.id && <a href={`/fr/product/${product.slug}?preview=1`} target="_blank" className="btn-outline btn-sm">Preview</a>}
            </div>
          </div>
        </Card>
        <Card title="Organisation">
          <div className="space-y-4">
            <Field label="SKU *"><input name="sku" required value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="field font-mono uppercase" /></Field>
            <Field label="URL slug" hint="Empty = generated from the French name"><input name="slug" defaultValue={product.slug} className="field font-mono text-sm" /></Field>
            <Field label="Category">
              <select name="categoryId" defaultValue={product.categoryId ?? ""} className="field">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            {collections.length > 0 && (
              <fieldset>
                <legend className="label">Collections</legend>
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {collections.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collections" value={c.id} defaultChecked={product.collectionIds.includes(c.id)} className="h-4 w-4 accent-majorelle" />{c.label}</label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="space-y-2 border-t border-charcoal/10 pt-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4 accent-majorelle" />Featured (shown first)</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="giftable" defaultChecked={product.giftable} className="h-4 w-4 accent-majorelle" />Gift (appears in Gifts)</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="personalizable" defaultChecked={product.personalizable} className="h-4 w-4 accent-majorelle" />Can be personalised</label>
            </div>
          </div>
        </Card>
        <Card title="Colours">
          <Checks name="colors" options={KNOWN_COLORS} selected={product.colors} extraName="colorsExtra" />
        </Card>
        <Card title="Patterns">
          <Checks name="patterns" options={KNOWN_PATTERNS} selected={product.patterns} extraName="patternsExtra" />
        </Card>
      </div>
    </AdminForm>
  );
}

type Img = { id: string; url: string; alt: I18n };

export function ImageManager({ productId, images }: { productId: string; images: Img[] }) {
  const btn = "rounded-lg bg-white/90 p-1.5 shadow hover:bg-white disabled:opacity-30";
  return (
    <Card title={`Photos (${images.length})`}>
      {images.length === 0 && <p className="mb-4 text-sm text-terracotta">No photo yet: products without photos look unfinished on the store.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((img, i) => (
          <div key={img.id} className="group">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-charcoal/10 bg-ivory-200">
              <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
              {i === 0 && <span className="absolute start-2 top-2 rounded-full bg-majorelle px-2 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <div className="flex gap-1">
                  <ImgOp id={img.id} op="first" disabled={i === 0} className={btn} label="Make main"><Star className="h-3.5 w-3.5" /></ImgOp>
                  <ImgOp id={img.id} op="up" disabled={i === 0} className={btn} label="Move earlier"><ArrowUp className="h-3.5 w-3.5 -rotate-90 rtl:rotate-90" /></ImgOp>
                  <ImgOp id={img.id} op="down" disabled={i === images.length - 1} className={btn} label="Move later"><ArrowDown className="h-3.5 w-3.5 -rotate-90 rtl:rotate-90" /></ImgOp>
                </div>
                <ImgOp id={img.id} op="delete" className={`${btn} text-terracotta`} label="Delete" confirm="Delete this photo?"><Trash2 className="h-3.5 w-3.5" /></ImgOp>
              </div>
            </div>
            <details className="mt-1.5 text-xs">
              <summary className="cursor-pointer text-charcoal-500">Alt text</summary>
              <AdminForm action={updateProductImage} className="mt-2 space-y-2">
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="op" value="alt" />
                <input name="alt.fr" defaultValue={img.alt?.fr || ""} placeholder="FR" className="field py-1.5 text-xs" />
                <input name="alt.ar" defaultValue={img.alt?.ar || ""} placeholder="AR" dir="rtl" className="field py-1.5 text-xs" />
                <input name="alt.en" defaultValue={img.alt?.en || ""} placeholder="EN" className="field py-1.5 text-xs" />
                <SubmitButton variant="outline">Save</SubmitButton>
              </AdminForm>
            </details>
          </div>
        ))}
      </div>
      <AdminForm action={addProductImages} className="mt-5 flex flex-wrap items-center gap-3 border-t border-charcoal/10 pt-5" resetOnSuccess>
        <input type="hidden" name="productId" value={productId} />
        <input type="file" name="images" accept="image/*" multiple required className="text-sm file:me-3 file:rounded-full file:border-0 file:bg-ivory-200 file:px-4 file:py-2 file:text-sm file:font-semibold" />
        <SubmitButton variant="outline">Upload photos</SubmitButton>
      </AdminForm>
    </Card>
  );
}

function ImgOp({ id, op, children, className, disabled, label, confirm }: { id: string; op: string; children: React.ReactNode; className: string; disabled?: boolean; label: string; confirm?: string }) {
  return (
    <AdminForm action={updateProductImage} confirm={confirm} quiet>
      <input type="hidden" name="imageId" value={id} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" disabled={disabled} className={className} title={label} aria-label={label}>{children}</button>
    </AdminForm>
  );
}
