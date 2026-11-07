import Link from "next/link";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; iso: string };

/** Infinite scrolling strip of destination chips (pauses on hover). */
export function FlagMarquee({ items, reverse, light }: { items: Item[]; reverse?: boolean; light?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="group mask-fade-x relative flex overflow-hidden">
      <ul className={cn("flex w-max shrink-0 gap-3 py-2 group-hover:[animation-play-state:paused]", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
        {row.map((it, i) => (
          <li key={`${it.href}-${i}`} aria-hidden={i >= items.length || undefined}>
            <Link
              href={it.href}
              tabIndex={i >= items.length ? -1 : undefined}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                light ? "border border-slate-200 bg-white text-navy-800 shadow-sm hover:border-gold-300 hover:shadow-soft" : "glass text-white hover:bg-white/15",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${it.iso}.svg`} alt="" className="h-4 w-6 rounded-[3px] object-cover" loading="lazy" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
