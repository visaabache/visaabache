import Link from "next/link";
import { Suspense } from "react";
import { flattenTree, getCategoryTree, getFacets, searchProducts, type ShopQuery } from "@/lib/catalog";
import { getDisplayCurrency } from "@/lib/currency";
import { fmt, type Dict, type Locale } from "@/lib/i18n";
import { ProductGrid } from "../product/ProductCard";
import { Filters } from "./Filters";

export type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => x.slice(0, 40)).slice(0, 12);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export function parseShopQuery(sp: SearchParams, rate: number): ShopQuery {
  const toMad = (v: string) => {
    const n = Number(v);
    return v && Number.isFinite(n) && n >= 0 ? Math.round((n / rate) * 100) : undefined;
  };
  return {
    q: one(sp.q).slice(0, 80) || undefined,
    min: toMad(one(sp.min)),
    max: toMad(one(sp.max)),
    colors: list(sp.color),
    patterns: list(sp.pattern),
    inStock: one(sp.stock) === "1",
    sort: one(sp.sort) || undefined,
    page: Math.max(1, Math.min(500, Number(one(sp.page)) || 1)),
  };
}

export async function ShopListing({ locale, d, sp, basePath, category, collection }: { locale: Locale; d: Dict; sp: SearchParams; basePath: string; category?: string; collection?: string }) {
  const currency = await getDisplayCurrency();
  const query = { ...parseShopQuery(sp, currency.rate), category, collection };
  const [result, facets, tree] = await Promise.all([searchProducts(query), getFacets(), getCategoryTree()]);
  const cats = flattenTree(tree).filter((c) => c.count > 0).map((c) => ({ slug: c.slug, name: c.name, depth: c.depth, count: c.count }));

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) if (k !== "page") next.append(k, x);
    if (p > 1) next.set("page", String(p));
    return `${basePath}${next.toString() ? `?${next}` : ""}`;
  };

  return (
    <Suspense>
      <Filters basePath={basePath} categories={cats} colors={facets.colors} patterns={facets.patterns} activeCategory={category} total={result.total}>
        {result.products.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-charcoal-600">{d.shop.noResults}</p>
            <Link href={`/${locale}/shop`} className="btn-outline">{d.shop.clearAll}</Link>
          </div>
        ) : (
          <ProductGrid products={result.products} locale={locale} d={d} currency={currency} priorityCount={4} />
        )}
        {result.pages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
            {result.page > 1 && <Link href={pageHref(result.page - 1)} className="btn-outline btn-sm" rel="prev">{d.shop.previous}</Link>}
            <span className="text-sm text-charcoal-500">{fmt(d.shop.page, { n: result.page, total: result.pages })}</span>
            {result.page < result.pages && <Link href={pageHref(result.page + 1)} className="btn-outline btn-sm" rel="next">{d.shop.next}</Link>}
          </nav>
        )}
      </Filters>
    </Suspense>
  );
}
