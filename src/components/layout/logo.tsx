import { cn } from "@/lib/utils";

/**
 * VISA ABACHE brand mark (owner-supplied 3D icon, public/brand/visa-abache-mark-*).
 * Icon only, no wordmark; the brand name is kept for screen readers and search engines via alt text.
 * - `animated`: metallic light sweep, soft breathing glow, twinkle at the plane, slight 3D tilt on hover.
 *   Everything stops for visitors with prefers-reduced-motion.
 * Size it with a height class (e.g. "h-11"); width follows the 1.28:1 aspect ratio.
 * The icon reads well on light and dark backgrounds, so there is no separate dark variant.
 */
export function Logo({ className, animated = true }: { light?: boolean; className?: string; animated?: boolean }) {
  return (
    <span
      className={cn("logo-anim relative inline-block aspect-[1.284/1] h-11 align-middle", animated && "is-animated", className)}
      style={{ ["--logo-mask" as string]: "url(/brand/visa-abache-mark-128.webp)" }}
      dir="ltr"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/visa-abache-mark-128.webp"
        srcSet="/brand/visa-abache-mark-128.webp 164w, /brand/visa-abache-mark-256.webp 329w"
        sizes="80px"
        alt="VISA ABACHE"
        width={164}
        height={128}
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
