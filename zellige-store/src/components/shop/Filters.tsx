"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useStore } from "../providers";
import type { I18nText } from "@/lib/i18n/config";

export const SWATCHES: Record<string, string> = {
  blue: "#1E3F8A", green: "#1E6B57", red: "#B4502F", yellow: "#D6A23A", white: "#FFFFFF", black: "#23211F",
  gold: "linear-gradient(135deg,#B8892B,#F0D58A,#B8892B)", turquoise: "#3AA6A0", orange: "#E07B39", brown: "#7A4B2A",
  multicolor: "conic-gradient(#1E3F8A,#1E6B57,#D6A23A,#B4502F,#1E3F8A)",
};

type Cat = { slug: string; name: I18nText; depth: number; count: number };

export function Filters({ basePath, categories, colors, patterns, activeCategory, total, children }: { basePath: string; categories: Cat[]; colors: string[]; patterns: string[]; activeCategory?: string; total: number; children: React.ReactNode }) {
  const { d, t, currency, href } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sel = (k: string) => sp.getAll(k);
  const hasFilters = ["min", "max", "color", "pattern", "stock"].some((k) => sp.has(k));
  const colorName = (c: string) => (d.colors as Record<string, string>)[c] || c;
  const patternName = (p: string) => (d.patterns as Record<string, string>)[p] || p;

  const onSort = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v === "featured") next.delete("sort");
    else next.set("sort", v);
    next.delete("page");
    router.push(`${basePath}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const form = (
    <form action={basePath} method="get" className="space-y-8" onSubmit={() => setOpen(false)}>
      {sp.get("q") && <input type="hidden" name="q" value={sp.get("q")!} />}
      {sp.get("sort") && <input type="hidden" name="sort" value={sp.get("sort")!} />}
      {categories.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">{d.shop.category}</legend>
          <ul className="space-y-1">
            <li>
              <Link href={href("/shop")} className={`block rounded-lg px-2 py-1.5 text-sm ${!activeCategory ? "bg-charcoal/5 font-semibold" : "hover:bg-charcoal/5"}`}>
                {d.nav.allProducts}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug} style={{ paddingInlineStart: c.depth * 12 }}>
                <Link href={href(`/category/${c.slug}`)} className={`flex justify-between rounded-lg px-2 py-1.5 text-sm ${activeCategory === c.slug ? "bg-charcoal/5 font-semibold" : "hover:bg-charcoal/5"}`}>
                  <span>{t(c.name)}</span>
                  <span className="text-xs text-charcoal-400">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
          {d.shop.price} ({currency.code})
        </legend>
        <div className="flex items-center gap-2">
          <input name="min" type="number" min={0} inputMode="numeric" defaultValue={sp.get("min") || ""} placeholder={d.shop.min} className="field py-2" aria-label={d.shop.min} />
          <span className="text-charcoal-400">–</span>
          <input name="max" type="number" min={0} inputMode="numeric" defaultValue={sp.get("max") || ""} placeholder={d.shop.max} className="field py-2" aria-label={d.shop.max} />
        </div>
      </fieldset>
      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">{d.shop.colour}</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="checkbox" name="color" value={c} defaultChecked={sel("color").includes(c)} className="peer sr-only" />
                <span className="chip peer-checked:border-majorelle peer-checked:ring-1 peer-checked:ring-majorelle peer-focus-visible:ring-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-charcoal/20" style={{ background: SWATCHES[c] || "#ccc" }} />
                  {colorName(c)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {patterns.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">{d.shop.pattern}</legend>
          <div className="space-y-2">
            {patterns.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" name="pattern" value={p} defaultChecked={sel("pattern").includes(p)} className="h-4 w-4 rounded border-charcoal/30 accent-majorelle" />
                {patternName(p)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">{d.shop.availability}</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={sp.get("stock") === "1"} className="h-4 w-4 accent-majorelle" />
          {d.shop.inStockOnly}
        </label>
      </fieldset>
      <div className="flex gap-2">
        <button className="btn-primary flex-1">{d.shop.apply}</button>
        {hasFilters && (
          <Link href={`${basePath}${sp.get("q") ? `?q=${encodeURIComponent(sp.get("q")!)}` : ""}`} className="btn-outline">
            {d.shop.clearAll}
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-charcoal/10 pb-4">
        <p className="text-sm text-charcoal-500">{total === 1 ? d.shop.oneResult : d.shop.results.replace("{n}", String(total))}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen(true)} className="btn-outline btn-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            {d.shop.filters}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-charcoal-500 sm:inline">{d.shop.sort}</span>
            <select value={sp.get("sort") || "featured"} onChange={(e) => onSort(e.target.value)} className="rounded-full border border-charcoal/15 bg-white py-2 pe-8 ps-4 text-sm md:!text-sm">
              {Object.entries(d.shop.sortOptions).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label={d.shop.filters}>
          <div className="sticky top-28">{form}</div>
        </aside>
        <div>{children}</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={d.shop.filters}>
          <button className="absolute inset-0 bg-charcoal/40" onClick={() => setOpen(false)} aria-label={d.nav.close} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-ivory p-5 pb-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">{d.shop.filters}</h2>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-charcoal/5" aria-label={d.nav.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {form}
          </div>
        </div>
      )}
    </>
  );
}
