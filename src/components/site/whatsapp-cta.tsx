"use client";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * WhatsApp button with a pre-written message. On the assistance page the message names the destination or package
 * from the link (?country=france / ?package=…), read in the browser so the page itself stays identical for every
 * visitor and can be served from the edge cache.
 */
export function WhatsAppCta({ number, message, label, hint, fromQuery, className }: {
  number: string;
  message: string;
  label: string;
  hint?: string;
  fromQuery?: { countries: Record<string, string>; packages: Record<string, string>; country: string; pkg: string };
  className?: string;
}) {
  const [text, setText] = useState(message);
  useEffect(() => {
    if (!fromQuery) return;
    const sp = new URLSearchParams(window.location.search);
    const c = fromQuery.countries[sp.get("country") || ""];
    const p = fromQuery.packages[sp.get("package") || ""];
    if (c) setText(fromQuery.country.replace("{country}", c));
    else if (p) setText(fromQuery.pkg.replace("{package}", p));
  }, [fromQuery]);
  if (!number) return null;
  return (
    <div className={className}>
      <a
        href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-7 text-base font-semibold text-white shadow-soft transition hover:bg-[#1ebe5b]")}
      >
        <WhatsAppIcon className="h-6 w-6" /> {label}
      </a>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
