"use client";
import { useEffect, useRef } from "react";

/** Thin gold reading-progress bar at the top of the page. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]" aria-hidden>
      <div ref={bar} className="h-full origin-left rtl:origin-right scale-x-0 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />
    </div>
  );
}
