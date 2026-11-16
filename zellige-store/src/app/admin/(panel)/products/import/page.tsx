import { PageHeader } from "@/components/admin/AdminNav";
import { Card } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/ImportForm";
import { PRODUCT_COLUMNS } from "@/lib/product-sheet";

export const metadata = { title: "Import / export" };

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import and export" description="Add or update many products at once from Excel or CSV." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Download the template">
          <p className="text-sm text-charcoal-600">Fill one row per product. Products are matched by <strong>SKU</strong>: an existing SKU is updated, a new SKU creates a product. Empty cells leave existing values unchanged.</p>
          <a href="/api/admin/export?what=template" className="btn-outline btn-sm mt-4">Download template (.xlsx)</a>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold">Columns</summary>
            <p className="mt-2 font-mono text-xs leading-6 text-charcoal-600">{PRODUCT_COLUMNS.join(" · ")}</p>
            <ul className="mt-3 list-disc space-y-1 ps-5 text-charcoal-600">
              <li><code>price_mad</code>: price in dirhams, e.g. 149 or 149,90.</li>
              <li><code>category</code>: the category slug shown in Categories.</li>
              <li><code>colors</code>, <code>patterns</code>: comma-separated, e.g. <code>blue, white</code>.</li>
              <li><code>images</code>: optional public image URLs separated by spaces.</li>
              <li><code>status</code>: DRAFT, PUBLISHED or ARCHIVED.</li>
              <li>A second sheet named <code>variants</code> adds colour/pattern/size variants.</li>
            </ul>
          </details>
        </Card>
        <Card title="2. Upload your file">
          <ImportForm />
        </Card>
        <Card title="Export" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <a href="/api/admin/export?what=products" className="btn-outline btn-sm">Products (.xlsx, with variants)</a>
            <a href="/api/admin/export?what=products&format=csv" className="btn-outline btn-sm">Products (.csv)</a>
            <a href="/api/admin/export?what=inventory" className="btn-outline btn-sm">Inventory (.xlsx)</a>
            <a href="/api/admin/export?what=inventory&format=csv" className="btn-outline btn-sm">Inventory (.csv)</a>
            <a href="/api/admin/export?what=orders" className="btn-outline btn-sm">Orders (.xlsx)</a>
          </div>
          <p className="mt-3 text-xs text-charcoal-500">An exported products file can be edited and imported back.</p>
        </Card>
      </div>
    </>
  );
}
