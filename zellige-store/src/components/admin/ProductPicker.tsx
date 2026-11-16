"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

type P = { id: string; sku: string; name: string; image: string | null; draft: boolean };

export function ProductPicker({ products, selected: initial }: { products: P[]; selected: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const matches = products.filter((p) => !selected.includes(p.id) && (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 30);
  const move = (i: number, d: number) => setSelected((s) => { const c = [...s]; const [x] = c.splice(i, 1); c.splice(Math.max(0, Math.min(c.length, i + d)), 0, x); return c; });
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {selected.map((id) => <input key={id} type="hidden" name="products" value={id} />)}
      <div>
        <p className="label">In this collection ({selected.length})</p>
        <ul className="max-h-96 space-y-1.5 overflow-y-auto">
          {selected.map((id, i) => {
            const p = byId.get(id);
            if (!p) return null;
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-charcoal/10 bg-white p-1.5 text-sm">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-ivory-200">{p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}</div>
                <span className="flex-1 truncate">{p.name}{p.draft && <em className="text-xs text-charcoal-400"> (draft)</em>}</span>
                <button type="button" onClick={() => move(i, -1)} className="p-1 hover:text-majorelle" aria-label="Up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 hover:text-majorelle" aria-label="Down"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setSelected((s) => s.filter((x) => x !== id))} className="p-1 text-terracotta" aria-label="Remove"><X className="h-3.5 w-3.5" /></button>
              </li>
            );
          })}
          {!selected.length && <li className="text-sm text-charcoal-500">Pick products on the right.</li>}
        </ul>
      </div>
      <div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add" className="field mb-2 py-2" />
        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {matches.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setSelected((s) => [...s, p.id])} className="flex w-full items-center gap-2 rounded-lg p-1.5 text-start text-sm hover:bg-ivory-200">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-ivory-200">{p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}</div>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-mono text-xs text-charcoal-400">{p.sku}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
