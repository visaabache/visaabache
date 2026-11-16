import Link from "next/link";
import { categoryOptions, collectionOptions } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/AdminNav";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const [categories, collections] = await Promise.all([categoryOptions(), collectionOptions()]);
  return (
    <>
      <PageHeader title="New product" actions={<Link href="/admin/products" className="btn-outline btn-sm">Back</Link>} />
      <ProductForm
        categories={categories}
        collections={collections}
        product={{
          sku: "", slug: "", status: "DRAFT", name: null, shortDescription: null, description: null, materials: null, care: null, craftType: "UNSPECIFIED", craftNote: null, seoTitle: null, seoDescription: null,
          price: null, compareAtPrice: null, stock: 0, lowStockThreshold: null, widthCm: null, heightCm: null, depthCm: null, diameterCm: null, capacityMl: null, weightG: null,
          colors: [], patterns: [], featured: false, giftable: false, personalizable: false, categoryId: null, collectionIds: [], variants: [],
        }}
      />
    </>
  );
}
