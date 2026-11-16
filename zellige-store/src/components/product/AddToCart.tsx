"use client";

import { useMemo, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart, useHydrated, useStore } from "../providers";
import { QtyStepper } from "../cart/CartDrawer";
import { WishlistButton } from "./WishlistButton";
import type { I18nText } from "@/lib/i18n/config";

type Variant = { id: string; name: I18nText; price: number | null; stock: number; color: string | null; pattern: string | null; size: string | null };

export function AddToCart({
  product,
}: {
  product: { id: string; slug: string; name: I18nText; price: number; compareAtPrice: number | null; stock: number; image: string | null; variants: Variant[] };
}) {
  const { d, money, t } = useStore();
  const cart = useCart();
  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(hasVariants ? product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = useMemo(() => product.variants.find((v) => v.id === variantId) ?? null, [product.variants, variantId]);
  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock : product.stock;
  const compare = product.compareAtPrice && product.compareAtPrice > price ? product.compareAtPrice : null;
  const hydrated = useHydrated();
  const inCart = !hydrated ? 0 : cart.lines.find((l) => l.productId === product.id && (l.variantId || null) === variantId)?.quantity ?? 0;
  const max = Math.max(0, stock - inCart);

  const add = () => {
    if (max <= 0) return;
    cart.add({ productId: product.id, variantId, quantity: Math.min(qty, max), slug: product.slug, name: product.name, variantName: variant?.name ?? null, image: product.image, price });
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2200);
    cart.setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3" aria-live="polite">
        <span className={`text-3xl font-semibold ${compare ? "text-terracotta" : ""}`}>{money(price)}</span>
        {compare && (
          <>
            <span className="text-lg text-charcoal-400 line-through">{money(compare)}</span>
            <span className="rounded-full bg-terracotta px-2.5 py-1 text-xs font-bold text-white">−{Math.round((1 - price / compare) * 100)}%</span>
          </>
        )}
      </div>

      {hasVariants && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            {d.product.chooseVariant}: <span className="font-normal text-charcoal-600">{variant ? t(variant.name) : ""}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                aria-pressed={v.id === variantId}
                className={`chip ${v.id === variantId ? "chip-active" : "bg-white"} ${v.stock <= 0 ? "line-through opacity-50" : ""}`}
              >
                {t(v.name)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className={`flex items-center gap-2 text-sm font-medium ${stock <= 0 ? "text-terracotta" : stock <= 5 ? "text-saffron-700" : "text-emerald"}`}>
        <span className={`h-2 w-2 rounded-full ${stock <= 0 ? "bg-terracotta" : stock <= 5 ? "bg-saffron" : "bg-emerald"}`} />
        {stock <= 0 ? d.product.outOfStock : stock <= 5 ? d.product.onlyLeft.replace("{n}", String(stock)) : d.product.inStock}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {stock > 0 && <QtyStepper value={Math.min(qty, Math.max(1, max))} onChange={setQty} max={Math.max(1, max)} label={d.product.quantity} />}
        <button type="button" onClick={add} disabled={max <= 0} className="btn-primary min-w-[200px] flex-1 py-3.5">
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {stock <= 0 ? d.product.outOfStock : added ? d.product.added : d.product.addToCart}
        </button>
        <WishlistButton productId={product.id} className="flex h-12 w-12 items-center justify-center rounded-full border border-charcoal/15 transition hover:border-charcoal" />
      </div>
    </div>
  );
}
