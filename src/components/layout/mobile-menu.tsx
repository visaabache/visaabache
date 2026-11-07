"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Full-screen mobile navigation. The panel is rendered in a portal on <body>: the sticky header uses
 * backdrop-filter, which would otherwise become the containing block of the fixed panel and clip it.
 */
export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(64);
  const btn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        ref={btn}
        onClick={() => {
          // Align the panel with the bottom of the header (a promo banner may sit above it).
          const header = btn.current?.closest("header");
          if (header) setTop(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={label}
        className="relative z-[71] rounded-lg p-2 text-navy-800 hover:bg-navy-50"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open &&
        createPortal(
          <div id="mobile-menu" role="dialog" aria-modal="true" aria-label={label} className="fixed inset-x-0 bottom-0 z-[70] lg:hidden" style={{ top }}>
            <button type="button" aria-label={label} className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div
              className="absolute inset-x-0 top-0 max-h-full animate-fade-in overflow-y-auto border-t border-slate-200 bg-white px-4 pb-10 pt-3 shadow-premium"
              onClick={(e) => {
                if ((e.target as Element).closest("a")) setOpen(false);
              }}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
