"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AccountNavLink({ href, label, icon, badge, exact }: { href: string; label: string; icon: ReactNode; badge?: number; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-white text-navy-800 shadow-sm" : "text-slate-600 hover:bg-white/70")}>
      {icon}
      <span className="flex-1">{label}</span>
      {badge ? <span className="rounded-full bg-gold-500 px-1.5 text-xs font-bold text-navy-900">{badge}</span> : null}
    </Link>
  );
}
