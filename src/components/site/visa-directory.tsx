"use client";
import { useState } from "react";
import Link from "@/components/ui/link";
import { ArrowRight, Search } from "lucide-react";

type C = { slug: string; iso: string; name: string; region: string; schengen: boolean };

export function VisaDirectory({ countries, locale, regions, placeholder, schengenLabel, emptyLabel, initialQuery }: {
  countries: C[]; locale: string; regions: Record<string, string>; placeholder: string; schengenLabel: string; emptyLabel: string; initialQuery: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtered = countries.filter((c) => !q || norm(c.name).includes(norm(q)) || c.slug.includes(norm(q)));
  const order = ["EUROPE", "NORTH_AMERICA", "ASIA", "OTHER"];
  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-3 text-sm shadow-sm focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/15"
        />
      </div>
      {order.map((r) => {
        const list = filtered.filter((c) => c.region === r);
        if (!list.length) return null;
        return (
          <div key={r} className="mt-12">
            <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-semibold text-navy-800">
              {regions[r]} <span className="text-sm font-normal text-slate-400">({list.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((c) => (
                <Link key={c.slug} href={`/${locale}/visas/${c.slug}`} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/flags/${c.iso}.svg`} alt="" className="h-8 w-12 rounded-[3px] object-cover shadow-sm ring-1 ring-black/5" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-800">{c.name}</p>
                    {c.schengen && <p className="text-xs text-slate-500">{schengenLabel}</p>}
                  </div>
                  <ArrowRight className="rtl-flip h-4 w-4 text-slate-300 group-hover:text-gold-600" />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <p className="mt-10 text-slate-500">{emptyLabel}</p>}
      <p className="mt-12 text-sm text-slate-500">{emptyLabel}</p>
    </div>
  );
}
