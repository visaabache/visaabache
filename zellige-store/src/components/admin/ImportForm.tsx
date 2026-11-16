"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { importSheet } from "@/actions/admin/import";
import type { ImportReport } from "@/lib/product-sheet";

export function ImportForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; message?: string; data?: ImportReport } | null>(null);
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await importSheet(fd);
          setResult(r as typeof result);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <input type="file" name="file" accept=".xlsx,.csv" required className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-majorelle file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" className="h-4 w-4 accent-majorelle" />Publish new products immediately (when no status column is filled)</label>
      <button className="btn-primary btn-sm" disabled={pending}>{pending ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</> : "Import"}</button>
      {result?.error && <p className="rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-700">{result.error}</p>}
      {result?.message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{result.message}</p>}
      {result?.data && result.data.errors.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-terracotta/30 text-sm">
          <table className="w-full">
            <thead className="bg-terracotta-50 text-xs"><tr><th className="p-2 text-start">Row</th><th className="p-2 text-start">SKU</th><th className="p-2 text-start">Problem</th></tr></thead>
            <tbody>{result.data.errors.map((e, i) => <tr key={i} className="border-t border-charcoal/5"><td className="p-2">{e.row}</td><td className="p-2 font-mono text-xs">{e.sku}</td><td className="p-2">{e.message}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </form>
  );
}
