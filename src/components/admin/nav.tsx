"use client";
import { useState } from "react";
import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, BookOpen, Briefcase, FileText, Flag, FolderOpen, Globe, HelpCircle, Inbox, LayoutDashboard, List, Lock, Mail, Megaphone, Menu,
  MessagesSquare, Package, Receipt, Scale, Settings, Shield, Star, Tag, Users, Wallet, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard, folder: FolderOpen, users: Users, inbox: Inbox, message: MessagesSquare, wallet: Wallet, receipt: Receipt, chart: BarChart3,
  globe: Globe, briefcase: Briefcase, package: Package, flag: Flag, book: BookOpen, help: HelpCircle, scale: Scale, star: Star, megaphone: Megaphone,
  tag: Tag, mail: Mail, settings: Settings, shield: Shield, lock: Lock, zap: Zap, list: List, file: FileText,
} as const;

export type NavGroup = { title: string; items: { href: string; label: string; icon: string; badge?: number; exact?: boolean }[] };

export function AdminNav({ groups, menuLabel }: { groups: NavGroup[]; menuLabel: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Menu className="h-4 w-4" /> {menuLabel}
      </button>
      <nav className={cn("space-y-5 px-3 pb-6", open ? "block" : "hidden lg:block")}>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-widest text-navy-400">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const Icon = ICONS[i.icon as keyof typeof ICONS] || FileText;
                const active = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
                return (
                  <li key={i.href}>
                    <Link href={i.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition", active ? "bg-gold-500 font-semibold text-navy-900" : "hover:bg-white/10 hover:text-white")}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{i.label}</span>
                      {!!i.badge && <span className={cn("rounded-full px-1.5 text-[11px] font-bold", active ? "bg-navy-900 text-gold-400" : "bg-gold-500 text-navy-900")}>{i.badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
