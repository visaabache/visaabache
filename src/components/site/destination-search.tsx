"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Item = { slug: string; name: string; iso: string };

export function DestinationSearch({ items, locale, placeholder, button }: { items: Item[]; locale: string; placeholder: string; button: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const matches = useMemo(() => (q.trim() ? items.filter((i) => norm(i.name).includes(norm(q.trim())) || i.slug.includes(norm(q.trim()))).slice(0, 6) : []), [q, items]);

  function go(slug?: string) {
    if (slug) router.push(`/${locale}/visas/${slug}`);
    else if (matches[0]) router.push(`/${locale}/visas/${matches[0].slug}`);
    else router.push(`/${locale}/visas${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="relative w-full max-w-xl"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-premium ring-1 ring-black/5">
        <Search className="ms-2 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          autoComplete="off"
        />
        <button type="submit" className="h-11 shrink-0 rounded-xl bg-gold-500 px-4 text-sm font-bold text-navy-900 transition hover:bg-gold-400 sm:px-6">
          {button}
        </button>
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white text-slate-800 shadow-premium ring-1 ring-black/5" role="listbox">
          {matches.map((m) => (
            <li key={m.slug}>
              <button type="button" onMouseDown={() => go(m.slug)} className="flex w-full items-center gap-3 px-4 py-2.5 text-start hover:bg-navy-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${m.iso}.svg`} alt="" className="h-4 w-6 rounded-sm object-cover" />
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
