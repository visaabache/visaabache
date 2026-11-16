"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Boxes, FileText, FolderTree, Layers, LogOut, Mail, Menu, MessageSquareQuote, Package, Settings, ShoppingCart, Star, Tag, Truck, Upload, Users, X, ExternalLink,
} from "lucide-react";
import { StarMark } from "../ui/Zellige";

const GROUPS = [
  { items: [{ href: "/admin", label: "Dashboard", icon: BarChart3 }] },
  { title: "Sales", items: [{ href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "orders" }, { href: "/admin/customers", label: "Customers", icon: Users }, { href: "/admin/discounts", label: "Discount codes", icon: Tag }] },
  { title: "Catalog", items: [{ href: "/admin/products", label: "Products", icon: Package }, { href: "/admin/products/import", label: "Import / export", icon: Upload }, { href: "/admin/categories", label: "Categories", icon: FolderTree }, { href: "/admin/collections", label: "Collections", icon: Layers }, { href: "/admin/inventory", label: "Inventory", icon: Boxes, badge: "lowStock" }] },
  { title: "Content", items: [{ href: "/admin/reviews", label: "Reviews", icon: Star, badge: "reviews" }, { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote }, { href: "/admin/pages", label: "Pages", icon: FileText }, { href: "/admin/newsletter", label: "Newsletter", icon: Mail }] },
  { title: "Store", items: [{ href: "/admin/shipping", label: "Delivery", icon: Truck }, { href: "/admin/settings", label: "Settings", icon: Settings }] },
] as const;

export function AdminNav({ storeName, user, counts, logout }: { storeName: string; user: { name: string; role: string }; counts: Record<string, number>; logout: () => Promise<void> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || (path.startsWith(href + "/") && !(href === "/admin/products" && path.startsWith("/admin/products/import"))));
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <StarMark className="h-8 w-8" />
        <span className="font-display text-xl font-semibold">{storeName}</span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {GROUPS.map((g, i) => (
          <div key={i}>
            {"title" in g && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/40">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const n = "badge" in it ? counts[it.badge] : 0;
                return (
                  <li key={it.href}>
                    <Link href={it.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active(it.href) ? "bg-white/10 font-semibold text-white" : "text-ivory/75 hover:bg-white/5 hover:text-white"}`}>
                      <it.icon className="h-4 w-4" />
                      <span className="flex-1">{it.label}</span>
                      {n > 0 && <span className="rounded-full bg-saffron px-1.5 text-[11px] font-bold text-charcoal">{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-white/10 p-3">
        <a href="/fr" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ivory/75 hover:bg-white/5"><ExternalLink className="h-4 w-4" />View store</a>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ivory/75 hover:bg-white/5"><LogOut className="h-4 w-4" />Sign out · {user.name.split(" ")[0]}</button>
        </form>
      </div>
    </nav>
  );
  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 bg-charcoal text-ivory lg:block">{nav}</aside>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-charcoal/10 bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-charcoal/5"><Menu className="h-5 w-5" /></button>
        <span className="font-semibold">{storeName} admin</span>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-charcoal/50" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="absolute inset-y-0 start-0 w-72 bg-charcoal text-ivory">
            <button onClick={() => setOpen(false)} className="absolute end-3 top-4 text-ivory/70" aria-label="Close"><X className="h-5 w-5" /></button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-charcoal-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
