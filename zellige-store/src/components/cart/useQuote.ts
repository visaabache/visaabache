"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/cart";
import { useCart, useStore } from "../providers";

/** Asks the server for authoritative prices, stock, delivery fee and discount. Client prices are only a preview. */
export function useQuote(opts: { country?: string; cityId?: string | null; code?: string | null } = {}) {
  const { lines, ready, replace } = useCart();
  const { locale } = useStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const key = JSON.stringify([lines.map((l) => [l.productId, l.variantId, l.quantity]), opts.country, opts.cityId, opts.code]);

  useEffect(() => {
    if (!ready) return;
    if (!lines.length) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(() => {
      fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), country: opts.country, cityId: opts.cityId, code: opts.code, locale }),
      })
        .then((r) => r.json())
        .then((q: Quote) => {
          if (id !== seq.current) return;
          setQuote(q);
          setLoading(false);
          // Keep the stored cart in sync with server prices and remove lines that no longer exist.
          const known = new Map(q.lines.map((l) => [l.key, l]));
          const next = lines
            .filter((l) => known.has(`${l.productId}:${l.variantId || ""}`))
            .map((l) => {
              const s = known.get(`${l.productId}:${l.variantId || ""}`)!;
              return { ...l, price: s.unitPrice, name: s.name, image: s.image, slug: s.slug };
            });
          if (next.length !== lines.length || next.some((l, i) => l.price !== lines[i].price)) replace(next);
        })
        .catch(() => id === seq.current && setLoading(false));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return { quote, loading };
}
