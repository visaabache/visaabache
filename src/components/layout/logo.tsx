import { cn } from "@/lib/utils";

/**
 * VISA ABACHE brand mark ("Flight V"): the V's right stroke becomes a take-off trajectory ending in a plane.
 * - `light`: for dark backgrounds (mark without tile, white wordmark)
 * - `animated`: the plane glides gently along its dotted path (disabled for prefers-reduced-motion)
 */
export function BrandMark({ className, tile = true, animated = true }: { className?: string; tile?: boolean; animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="va-mark-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4EAD4" />
          <stop offset=".45" stopColor="#D8B978" />
          <stop offset="1" stopColor="#B08944" />
        </linearGradient>
        <linearGradient id="va-mark-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1F3B69" />
          <stop offset="1" stopColor="#07111F" />
        </linearGradient>
      </defs>
      {tile && <rect width="64" height="64" rx="16" fill="url(#va-mark-navy)" />}
      <path d="M14 17 L29.5 46 Q31 48.6 32.6 46 L38 36.2" fill="none" stroke="url(#va-mark-gold)" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M41.2 30.4 Q45 23.4 50.5 16.5"
        fill="none"
        stroke="url(#va-mark-gold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.1 4.6"
        className={animated ? "logo-trail" : undefined}
      />
      <g className={animated ? "logo-plane" : undefined}>
        <g transform="translate(51.5 14.6) rotate(-52)">
          <path
            d="M6 0 L-0.6 -1.25 L-2.8 -5.2 L-4.2 -5.2 L-2.6 -1.25 L-4.8 -1.25 L-6 -2.9 L-6.9 -2.9 L-6.3 0 L-6.9 2.9 L-6 2.9 L-4.8 1.25 L-2.6 1.25 L-4.2 5.2 L-2.8 5.2 L-0.6 1.25 Z"
            fill="url(#va-mark-gold)"
          />
        </g>
      </g>
    </svg>
  );
}

export function Logo({ light, className, animated = true }: { light?: boolean; className?: string; animated?: boolean }) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)} dir="ltr">
      <BrandMark className="h-9 w-9 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" tile={!light} animated={animated} />
      <span className="leading-none">
        <span className={cn("block text-[17px] font-extrabold tracking-[0.18em]", light ? "text-white" : "text-navy-800")}>
          VISA <span className="text-gold-500">ABACHE</span>
        </span>
      </span>
    </span>
  );
}
