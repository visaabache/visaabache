"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useStore } from "../providers";

type Img = { url: string; alt: string; width: number | null; height: number | null };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const { d } = useStore();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(document.dir === "rtl" ? -1 : 1);
      if (e.key === "ArrowLeft") go(document.dir === "rtl" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (!count) return <div className="aspect-[4/5] rounded-3xl bg-ivory-200" />;
  const current = images[index];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {count > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[640px] md:w-20 md:flex-col md:overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === index}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition md:w-full ${i === index ? "border-majorelle" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1">
        <div
          className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-3xl bg-ivory-200"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) {
              e.preventDefault();
              go((dx < 0 ? 1 : -1) * (document.dir === "rtl" ? -1 : 1));
            }
          }}
        >
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          <span className="pointer-events-none absolute bottom-3 end-3 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium sm:flex">
            <ZoomIn className="h-3.5 w-3.5" />
            {d.product.zoomHint}
          </span>
          {count > 1 && (
            <span className="absolute bottom-3 start-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold tabular-nums md:hidden">
              {index + 1} / {count}
            </span>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/95" role="dialog" aria-modal="true" aria-label={name}>
          <button type="button" onClick={() => setLightbox(false)} className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={d.nav.close}>
            <X className="h-5 w-5" />
          </button>
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute start-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={d.shop.previous}>
                <ChevronLeft className="rtl-flip h-6 w-6" />
              </button>
              <button type="button" onClick={() => go(1)} className="absolute end-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label={d.shop.next}>
                <ChevronRight className="rtl-flip h-6 w-6" />
              </button>
            </>
          )}
          <div className="h-full w-full overflow-auto">
            <div className="relative mx-auto h-full min-h-[100svh] w-full max-w-5xl">
              <Image src={current.url} alt={current.alt || name} fill sizes="100vw" quality={90} className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
