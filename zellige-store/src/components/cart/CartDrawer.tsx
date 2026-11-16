"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart, useStore } from "../providers";

export function QtyStepper({ value, onChange, max = 99, label }: { value: number; onChange: (v: number) => void; max?: number; label: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-charcoal/15" role="group" aria-label={label}>
      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-charcoal/5 disabled:opacity-30" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="−">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-charcoal/5 disabled:opacity-30" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="+">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { d, money, t, href } = useStore();
  const { lines, drawerOpen, setDrawerOpen, setQuantity, remove, count } = useCart();
  const pathname = usePathname();
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  useEffect(() => setDrawerOpen(false), [pathname, setDrawerOpen]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={d.cart.title}>
      <button className="absolute inset-0 bg-charcoal/40" onClick={() => setDrawerOpen(false)} aria-label={d.nav.close} />
      <div className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-ivory shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-charcoal/10 px-5">
          <h2 className="font-display text-2xl font-semibold">
            {d.cart.title} <span className="text-base font-normal text-charcoal-500">({count})</span>
          </h2>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-charcoal/5" onClick={() => setDrawerOpen(false)} aria-label={d.nav.close}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-charcoal-400" />
            <p className="text-charcoal-600">{d.cart.empty}</p>
            <Link href={href("/shop")} className="btn-primary">
              {d.cart.continue}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-charcoal/10 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={`${l.productId}:${l.variantId}`} className="flex gap-4 py-4">
                  <Link href={href(`/product/${l.slug}`)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory-200">
                    {l.image && <Image src={l.image} alt={t(l.name)} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={href(`/product/${l.slug}`)} className="line-clamp-2 text-sm font-semibold leading-snug">
                      {t(l.name)}
                    </Link>
                    {l.variantName && <p className="mt-0.5 text-xs text-charcoal-500">{t(l.variantName)}</p>}
                    <p className="mt-1 text-sm">{money(l.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper value={l.quantity} onChange={(q) => setQuantity(l.productId, l.variantId, q)} label={d.product.quantity} />
                      <button type="button" className="text-xs text-charcoal-500 underline-offset-4 hover:underline" onClick={() => remove(l.productId, l.variantId)}>
                        {d.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-charcoal/10 bg-white p-5">
              <div className="flex justify-between text-sm">
                <span>{d.cart.subtotal}</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <p className="text-xs text-charcoal-500">
                {d.cart.shipping}: {d.cart.shippingAtCheckout}
              </p>
              <Link href={href("/checkout")} className="btn-primary w-full">
                {d.cart.checkout}
              </Link>
              <Link href={href("/cart")} className="btn-outline w-full">
                {d.cart.title}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
