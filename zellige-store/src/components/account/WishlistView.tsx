"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { ProductCard } from "@/lib/catalog";
import { useStore, useWishlist } from "../providers";
import { WishlistButton } from "../product/WishlistButton";

export function WishlistView() {
  const { d, t, money, href } = useStore();
  const { ids, ready } = useWishlist();
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!ready) return;
    if (!ids.length) return setProducts([]);
    fetch(`/api/products?ids=${key}`).then((r) => r.json()).then((j: { products: ProductCard[] }) => setProducts(j.products)).catch(() => setProducts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  if (!products) return <div className="h-64 animate-pulse rounded-2xl bg-ivory-200" />;
  const visible = products.filter((p) => ids.includes(p.id));
  if (!visible.length)
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <Heart className="h-10 w-10 text-charcoal-400" />
        <p className="max-w-sm text-charcoal-600">{d.wishlist.empty}</p>
        <Link href={href("/shop")} className="btn-primary">{d.cart.continue}</Link>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {visible.map((p) => (
        <article key={p.id} className="relative">
          <Link href={href(`/product/${p.slug}`)}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-200">{p.image && <Image src={p.image.url} alt={t(p.name)} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />}</div>
            <h2 className="mt-3 line-clamp-2 text-[15px] font-semibold">{t(p.name)}</h2>
            <p className="mt-1 text-[15px] font-semibold">{money(p.price)}</p>
          </Link>
          <div className="absolute end-3 top-3"><WishlistButton productId={p.id} /></div>
          <Link href={href(`/product/${p.slug}`)} className="btn-outline btn-sm mt-3 w-full">{d.wishlist.moveToCart}</Link>
        </article>
      ))}
    </div>
  );
}
