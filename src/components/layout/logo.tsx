import { cn } from "@/lib/utils";

/**
 * VISA ABACHE logo (owner-supplied 3D artwork, public/brand/).
 * - `light`: variant for dark backgrounds ("VISA" in silver instead of navy)
 * - `animated`: metallic light sweep across the gold, soft breathing glow, twinkle at the plane,
 *   slight 3D tilt on hover. Everything stops for visitors with prefers-reduced-motion.
 * Size it with a height class (e.g. "h-11"); width follows the 4.27:1 aspect ratio.
 */
export function Logo({ light, className, animated = true }: { light?: boolean; className?: string; animated?: boolean }) {
  const base = light ? "/brand/visa-abache-logo-on-dark" : "/brand/visa-abache-logo";
  return (
    <span
      className={cn("logo-anim relative inline-block aspect-[4.27/1] h-11 align-middle", animated && "is-animated", className)}
      style={{ ["--logo-mask" as string]: `url(${base}-480.webp)` }}
      dir="ltr"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-480.webp`}
        srcSet={`${base}-480.webp 480w, ${base}-960.webp 960w`}
        sizes="(min-width: 1024px) 260px, 200px"
        alt="VISA ABACHE"
        width={480}
        height={112}
        className="block h-full w-full object-contain"
        decoding="async"
      />
      {animated && (
        <>
          <span className="logo-shine" aria-hidden />
          <span className="logo-twinkle" aria-hidden />
        </>
      )}
    </span>
  );
}
