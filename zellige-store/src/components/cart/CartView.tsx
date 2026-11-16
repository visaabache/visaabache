"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ShoppingBag, Truck } from "lucide-react";
import { useCart, useStore } from "../providers";
import { QtyStepper } from "./CartDrawer";
import { useQuote } from "./useQuote";

export function CartView() {
  const { d, money, t, href } = useStore();
  const { lines, setQuantity, remove, ready } = useCart();
  const { quote, loading } = useQuote({ country: "MA" });

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-ivory-200" />;
  if (!lines.length)
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <ShoppingBag className="h-10 w-10 text-charcoal-400" />
        <p className="text-charcoal-600">{d.cart.empty}</p>
        <Link href={href("/shop")} className="btn-primary">{d.cart.continue}</Link>
      </div>
    );

  const priced = new Map(quote?.lines.map((l) => [l.key, l]) ?? []);
  const subtotal = quote?.totals.subtotal ?? lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const threshold = quote?.freeThresholdMa ?? 0;
  const afterDiscount = subtotal - (quote?.totals.discount ?? 0);
  const remaining = threshold > 0 ? Math.max(0, threshold - afterDiscount) : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
        {lines.map((l) => {
          const s = priced.get(`${l.productId}:${l.variantId || ""}`);
          return (
            <li key={`${l.productId}:${l.variantId}`} className="flex gap-4 py-5 sm:gap-6">
              <Link href={href(`/product/${l.slug}`)} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-ivory-200 sm:h-36 sm:w-28">
                {l.image && <Image src={l.image} alt={t(l.name)} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={href(`/product/${l.slug}`)} className="font-semibold leading-snug">{t(l.name)}</Link>
                    {l.variantName && <p className="mt-0.5 text-sm text-charcoal-500">{t(l.variantName)}</p>}
                    <p className="mt-1 text-sm text-charcoal-600">{money(s?.unitPrice ?? l.price)}</p>
                  </div>
                  <p className="font-semibold">{money((s?.unitPrice ?? l.price) * l.quantity)}</p>
                </div>
                {s && s.status !== "ok" && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-terracotta">
                    <AlertTriangle className="h-4 w-4" />
                    {s.status === "unavailable" ? d.cart.unavailable : d.cart.adjusted}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  {s?.status === "unavailable" ? <span /> : <QtyStepper value={l.quantity} max={s ? Math.max(1, s.maxQuantity) : 99} onChange={(q) => setQuantity(l.productId, l.variantId, q)} label={d.product.quantity} />}
                  <button type="button" onClick={() => remove(l.productId, l.variantId)} className="text-sm text-charcoal-500 hover:text-charcoal hover:underline">{d.cart.remove}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-28">
        {threshold > 0 && (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            <p className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4" />{remaining > 0 ? d.cart.freeShippingProgress.replace("{amount}", money(remaining)) : d.cart.freeShippingReached}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${Math.min(100, (afterDiscount / threshold) * 100)}%` }} /></div>
          </div>
        )}
        <div className="flex justify-between"><span>{d.cart.subtotal}</span><span className={`font-semibold ${loading ? "opacity-50" : ""}`}>{money(subtotal)}</span></div>
        <div className="flex justify-between text-sm text-charcoal-500"><span>{d.cart.shipping}</span><span>{d.cart.shippingAtCheckout}</span></div>
        <Link href={href("/checkout")} className={`btn-primary w-full ${quote && quote.itemCount === 0 ? "pointer-events-none opacity-50" : ""}`}>{d.cart.checkout}</Link>
        <Link href={href("/shop")} className="block text-center text-sm text-charcoal-600 hover:underline">{d.cart.continue}</Link>
      </aside>
    </div>
  );
}
