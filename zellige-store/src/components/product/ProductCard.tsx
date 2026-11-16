import Image from "next/image";
import Link from "next/link";
import type { ProductCard as Card } from "@/lib/catalog";
import { tr, type Dict, type Locale } from "@/lib/i18n";
import { formatMoney, type DisplayCurrency } from "@/lib/money";
import { Stars } from "../ui/Stars";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ p, locale, d, currency, priority = false }: { p: Card; locale: Locale; d: Dict; currency: DisplayCurrency; priority?: boolean }) {
  const name = tr(p.name, locale);
  const onSale = p.compareAtPrice !== null;
  return (
    <article className="group relative">
      <Link href={`/${locale}/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-200">
          {p.image ? (
            <Image
              src={p.image.url}
              alt={tr(p.image.alt, locale) || name}
              fill
              priority={priority}
              sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, 50vw"
              className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${p.image2 ? "group-hover:opacity-0" : ""}`}
            />
          ) : null}
          {p.image2 && (
            <Image src={p.image2.url} alt="" aria-hidden fill sizes="(min-width:1280px) 300px, (min-width:768px) 33vw, 50vw" className="object-cover opacity-0 transition duration-700 group-hover:opacity-100" />
          )}
          <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {onSale && <span className="rounded-full bg-terracotta px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{d.product.sale}</span>}
            {p.isNew && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-majorelle">{d.product.new}</span>}
          </div>
          {p.available === 0 && (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-charcoal/80 py-1.5 text-center text-xs font-semibold text-white">{d.product.outOfStock}</span>
          )}
        </div>
        <div className="mt-3 space-y-1 px-0.5">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-charcoal">{name}</h3>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={`text-[15px] font-semibold ${onSale ? "text-terracotta" : "text-charcoal"}`}>
              {p.fromPrice && <span className="text-xs font-normal text-charcoal-500">{d.common.from} </span>}
              {formatMoney(p.price, locale, currency)}
            </span>
            {onSale && <span className="text-sm text-charcoal-400 line-through">{formatMoney(p.compareAtPrice!, locale, currency)}</span>}
          </div>
          {p.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
              <Stars value={p.ratingAvg} size={12} />({p.ratingCount})
            </div>
          )}
        </div>
      </Link>
      <div className="absolute end-3 top-3">
        <WishlistButton productId={p.id} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, locale, d, currency, priorityCount = 0 }: { products: Card[]; locale: Locale; d: Dict; currency: DisplayCurrency; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} locale={locale} d={d} currency={currency} priority={i < priorityCount} />
      ))}
    </div>
  );
}
