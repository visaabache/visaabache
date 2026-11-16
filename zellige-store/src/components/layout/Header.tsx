"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronDown, Globe } from "lucide-react";
import { useCart, useHydrated, useStore, useWishlist } from "../providers";
import { StarMark } from "../ui/Zellige";
import { locales, localeNames, localeShort, type I18nText, type Locale } from "@/lib/i18n/config";

type NavCategory = { slug: string; name: I18nText; children: { slug: string; name: I18nText }[] };

function useLocaleHref() {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  return (l: Locale) => {
    const parts = pathname.split("/");
    parts[1] = l;
    const qs = search?.toString();
    return parts.join("/") + (qs ? `?${qs}` : "");
  };
}

function Preferences({ compact = false }: { compact?: boolean }) {
  const { locale, d, currency, currencies } = useStore();
  const router = useRouter();
  const localeHref = useLocaleHref();
  const setCurrency = (code: string) => {
    document.cookie = `dz_currency=${code}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-4"}`}>
      <div className="flex items-center gap-1" role="group" aria-label={d.nav.language}>
        {!compact && <Globe className="h-4 w-4 text-charcoal-500" aria-hidden />}
        {locales.map((l) => (
          <Link
            key={l}
            href={localeHref(l)}
            hrefLang={l}
            lang={l}
            title={localeNames[l]}
            aria-current={l === locale ? "true" : undefined}
            className={`rounded-full px-2 py-1 text-xs font-semibold transition ${l === locale ? "bg-charcoal text-ivory" : "text-charcoal-600 hover:bg-charcoal/5"}`}
          >
            {compact ? localeShort[l] : localeNames[l]}
          </Link>
        ))}
      </div>
      {currencies.length > 1 && (
        <label className="relative flex items-center">
          <span className="sr-only">{d.nav.currency}</span>
          <select
            value={currency.code}
            onChange={(e) => setCurrency(e.target.value)}
            className="cursor-pointer appearance-none rounded-full border border-charcoal/15 bg-transparent py-1 pe-6 ps-3 text-xs font-semibold text-charcoal-600 md:!text-xs"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-1.5 h-3 w-3 text-charcoal-500" aria-hidden />
        </label>
      )}
    </div>
  );
}

export function Header({ storeName, categories }: { storeName: string; categories: NavCategory[] }) {
  const { d, href, t } = useStore();
  const { count, setDrawerOpen, ready } = useCart();
  const wish = useWishlist();
  const hydrated = useHydrated();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const nav = [
    { href: href("/shop"), label: d.nav.shop },
    { href: href("/collections"), label: d.nav.collections },
    { href: href("/gifts"), label: d.nav.gifts },
    { href: href("/craftsmanship"), label: d.nav.craft },
  ];

  const iconBtn = "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition hover:bg-charcoal/5";

  return (
    <>
      <div className="hidden border-b border-charcoal/10 bg-ivory-200/60 md:block">
        <div className="container flex h-9 items-center justify-between text-xs text-charcoal-600">
          <p>
            {d.home.perks.delivery} · {d.home.perks.cod}
          </p>
          <div className="flex items-center gap-5">
            <Link href={href("/track")} className="hover:text-charcoal">
              {d.nav.track}
            </Link>
            <Preferences />
          </div>
        </div>
      </div>
      <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-charcoal/10 bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory"}`}>
        <div className="container flex h-16 items-center gap-2 md:h-20">
          <button type="button" className={`${iconBtn} lg:hidden`} onClick={() => setMenuOpen(true)} aria-label={d.nav.menu}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href={href("/")} className="flex shrink-0 items-center gap-2.5" aria-label={storeName}>
            <StarMark className="h-8 w-8 md:h-9 md:w-9" />
            <span className="font-display text-xl font-semibold tracking-wide md:text-2xl">{storeName}</span>
          </Link>

          <nav className="ms-10 hidden items-center gap-1 lg:flex" aria-label="Main">
            <div className="group relative">
              <Link href={href("/shop")} className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium hover:bg-charcoal/5">
                {d.nav.shop}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
              </Link>
              {categories.length > 0 && (
                <div className="invisible absolute start-0 top-full z-50 w-[560px] pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="card grid grid-cols-2 gap-6 p-6 shadow-card">
                    {categories.map((c) => (
                      <div key={c.slug}>
                        <Link href={href(`/category/${c.slug}`)} className="font-display text-lg font-semibold hover:text-majorelle">
                          {t(c.name)}
                        </Link>
                        <ul className="mt-2 space-y-1.5">
                          {c.children.map((s) => (
                            <li key={s.slug}>
                              <Link href={href(`/category/${s.slug}`)} className="text-sm text-charcoal-600 hover:text-charcoal">
                                {t(s.name)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <Link href={href("/shop")} className="col-span-2 border-t border-charcoal/10 pt-4 text-sm font-semibold text-majorelle">
                      {d.nav.allProducts} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {nav.slice(1).map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-charcoal/5" aria-current={pathname === n.href ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center">
            <button type="button" className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label={d.nav.search} aria-expanded={searchOpen}>
              <Search className="h-5 w-5" />
            </button>
            <Link href={href("/wishlist")} className={`${iconBtn} hidden sm:inline-flex`} aria-label={d.nav.wishlist}>
              <Heart className="h-5 w-5" />
              {hydrated && wish.ready && wish.ids.length > 0 && <Badge n={wish.ids.length} />}
            </Link>
            <Link href={href("/account")} className={`${iconBtn} hidden sm:inline-flex`} aria-label={d.nav.account}>
              <User className="h-5 w-5" />
            </Link>
            <button type="button" className={iconBtn} onClick={() => setDrawerOpen(true)} aria-label={hydrated ? `${d.nav.cart} (${count})` : d.nav.cart}>
              <ShoppingBag className="h-5 w-5" />
              {hydrated && ready && count > 0 && <Badge n={count} />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="border-t border-charcoal/10 bg-ivory">
            <form action={href("/shop")} className="container flex items-center gap-3 py-3" role="search">
              <Search className="h-5 w-5 shrink-0 text-charcoal-500" aria-hidden />
              <input ref={searchRef} name="q" type="search" placeholder={d.nav.searchPlaceholder} className="w-full bg-transparent py-2 text-base outline-none placeholder:text-charcoal-400" aria-label={d.nav.search} />
              <button type="button" onClick={() => setSearchOpen(false)} className={iconBtn} aria-label={d.nav.close}>
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={d.nav.menu}>
          <button className="absolute inset-0 bg-charcoal/40" onClick={() => setMenuOpen(false)} aria-label={d.nav.close} />
          <div className="absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-ivory shadow-xl animate-fade-up">
            <div className="flex h-16 items-center justify-between border-b border-charcoal/10 px-4">
              <span className="font-display text-xl font-semibold">{storeName}</span>
              <button type="button" className={iconBtn} onClick={() => setMenuOpen(false)} aria-label={d.nav.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4" aria-label="Mobile">
              <ul className="space-y-1">
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block rounded-xl px-3 py-3 font-display text-xl font-semibold hover:bg-charcoal/5">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-charcoal/10 pt-4">
                {categories.map((c) => (
                  <div key={c.slug} className="mb-3">
                    <Link href={href(`/category/${c.slug}`)} className="block px-3 py-1.5 text-sm font-semibold">
                      {t(c.name)}
                    </Link>
                    <div className="flex flex-wrap gap-2 px-3 pt-1">
                      {c.children.map((s) => (
                        <Link key={s.slug} href={href(`/category/${s.slug}`)} className="chip text-xs">
                          {t(s.name)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-1 border-t border-charcoal/10 pt-4 text-sm">
                <li><Link href={href("/account")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-charcoal/5"><User className="h-4 w-4" />{d.nav.account}</Link></li>
                <li><Link href={href("/wishlist")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-charcoal/5"><Heart className="h-4 w-4" />{d.nav.wishlist}</Link></li>
                <li><Link href={href("/track")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-charcoal/5"><ShoppingBag className="h-4 w-4" />{d.nav.track}</Link></li>
              </ul>
            </nav>
            <div className="border-t border-charcoal/10 p-4">
              <Preferences compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold leading-none text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}
