"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Dict, I18nText, Locale } from "@/lib/i18n";
import { formatMoney, type DisplayCurrency } from "@/lib/money";

const noop = () => () => {};
/**
 * False while a component hydrates, true afterwards. Use it before rendering anything that comes from
 * localStorage (cart, wishlist): Suspense boundaries hydrate after the providers' effects have run,
 * so the provider's own "ready" flag can already be true during a later boundary's hydration.
 */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/* ---------- Store: locale, dictionary, currency ---------- */

type StoreCtx = {
  locale: Locale;
  d: Dict;
  currency: DisplayCurrency;
  currencies: DisplayCurrency[];
  loggedIn: boolean;
  money: (centimes: number) => string;
  t: (v: I18nText | null | undefined) => string;
  href: (path: string) => string;
};

const Store = createContext<StoreCtx | null>(null);

export function useStore() {
  const c = useContext(Store);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/* ---------- Cart (localStorage; prices re-validated by the server on every quote) ---------- */

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  slug: string;
  name: I18nText;
  variantName: I18nText | null;
  image: string | null;
  price: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

const Cart = createContext<CartCtx | null>(null);
export function useCart() {
  const c = useContext(Cart);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

/* ---------- Wishlist (localStorage, synced to the account when signed in) ---------- */

type WishCtx = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void; ready: boolean };
const Wish = createContext<WishCtx | null>(null);
export function useWishlist() {
  const c = useContext(Wish);
  if (!c) throw new Error("useWishlist outside provider");
  return c;
}

const CART_KEY = "dz_cart_v1";
const WISH_KEY = "dz_wishlist_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: the cart still works for this page view */
  }
}

const same = (a: { productId: string; variantId: string | null }, productId: string, variantId: string | null) =>
  a.productId === productId && (a.variantId || null) === (variantId || null);

export function Providers({
  children,
  locale,
  dict,
  currency,
  currencies,
  loggedIn,
}: {
  children: ReactNode;
  locale: Locale;
  dict: Dict;
  currency: DisplayCurrency;
  currencies: DisplayCurrency[];
  loggedIn: boolean;
}) {
  const store = useMemo<StoreCtx>(
    () => ({
      locale,
      d: dict,
      currency,
      currencies,
      loggedIn,
      money: (c) => formatMoney(c, locale, currency),
      t: (v) => (v ? v[locale]?.trim() || v.fr?.trim() || v.en?.trim() || v.ar?.trim() || "" : ""),
      href: (p) => `/${locale}${p === "/" ? "" : p}`,
    }),
    [locale, dict, currency, currencies, loggedIn],
  );

  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    setLines(read<CartLine[]>(CART_KEY, []));
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === CART_KEY && setLines(read<CartLine[]>(CART_KEY, []));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev).filter((l) => l.quantity > 0);
      write(CART_KEY, next);
      return next;
    });
  }, []);

  const cart = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      add: (line) =>
        update((prev) => {
          const i = prev.findIndex((l) => same(l, line.productId, line.variantId));
          if (i === -1) return [...prev, line];
          const copy = [...prev];
          copy[i] = { ...copy[i], ...line, quantity: Math.min(99, copy[i].quantity + line.quantity) };
          return copy;
        }),
      setQuantity: (productId, variantId, quantity) =>
        update((prev) => prev.map((l) => (same(l, productId, variantId) ? { ...l, quantity: Math.max(0, Math.min(99, quantity)) } : l))),
      remove: (productId, variantId) => update((prev) => prev.filter((l) => !same(l, productId, variantId))),
      clear: () => update(() => []),
      replace: (next) => update(() => next),
      drawerOpen,
      setDrawerOpen,
    }),
    [lines, ready, update, drawerOpen],
  );

  const [ids, setIds] = useState<string[]>([]);
  const [wishReady, setWishReady] = useState(false);
  const synced = useRef(false);
  useEffect(() => {
    const local = read<string[]>(WISH_KEY, []);
    setIds(local);
    setWishReady(true);
    if (!loggedIn || synced.current) return;
    synced.current = true;
    fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merge: local }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ids: string[] } | null) => {
        if (j?.ids) {
          setIds(j.ids);
          write(WISH_KEY, j.ids);
        }
      })
      .catch(() => {});
  }, [loggedIn]);

  const wish = useMemo<WishCtx>(
    () => ({
      ids,
      ready: wishReady,
      has: (id) => ids.includes(id),
      toggle: (id) =>
        setIds((prev) => {
          const adding = !prev.includes(id);
          const next = adding ? [id, ...prev] : prev.filter((x) => x !== id);
          write(WISH_KEY, next);
          if (loggedIn)
            fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adding ? { add: id } : { remove: id }) }).catch(() => {});
          return next;
        }),
    }),
    [ids, wishReady, loggedIn],
  );

  return (
    <Store.Provider value={store}>
      <Cart.Provider value={cart}>
        <Wish.Provider value={wish}>{children}</Wish.Provider>
      </Cart.Provider>
    </Store.Provider>
  );
}
