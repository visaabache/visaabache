"use client";

import { Heart } from "lucide-react";
import { useHydrated, useStore, useWishlist } from "../providers";

export function WishlistButton({ productId, className = "", withLabel = false }: { productId: string; className?: string; withLabel?: boolean }) {
  const { d } = useStore();
  const w = useWishlist();
  const hydrated = useHydrated();
  const active = hydrated && w.ready && w.has(productId);
  const label = active ? d.product.wishlistRemove : d.product.wishlistAdd;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        w.toggle(productId);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={className || "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105"}
    >
      <Heart className={`h-4 w-4 transition ${active ? "fill-terracotta text-terracotta" : "text-charcoal"}`} />
      {withLabel && <span>{label}</span>}
    </button>
  );
}
