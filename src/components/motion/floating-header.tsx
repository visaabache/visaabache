"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating "pill" header: transparent glass bar that detaches from the edges and compacts once the
 * visitor scrolls. Rendered as <header> so the mobile menu can align to it.
 */
export function FloatingHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={cn("no-print sticky z-40 transition-all duration-500", scrolled ? "top-2 px-2 sm:top-3 sm:px-4" : "top-0 px-0")}>
      <div
        data-scrolled={scrolled}
        className={cn(
          "mx-auto transition-all duration-500",
          scrolled
            ? "max-w-7xl rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_12px_40px_-16px_rgba(16,39,71,.35)] backdrop-blur-xl"
            : "max-w-none border-b border-slate-200/60 bg-white/85 backdrop-blur-md",
        )}
      >
        {children}
      </div>
    </header>
  );
}
