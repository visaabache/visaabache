import { photoFor, type DestinationPhoto as Photo } from "@/lib/destination-photos";
import { cn } from "@/lib/utils";

/**
 * Landmark photo of a destination (free-licensed, from Wikimedia Commons — see src/lib/destination-photos.ts).
 * Renders nothing when the destination has no photo, so callers can keep their flag-only fallback.
 */
export function DestinationPhoto({ slug, alt, className, sizes = "(min-width: 1024px) 25vw, 50vw", priority }: {
  slug: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const p = photoFor(slug);
  if (!p) return null;
  const base = `/images/destinations/${slug}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}-960.webp`}
      srcSet={`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`}
      sizes={sizes}
      alt={alt}
      width={960}
      height={540}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn("object-cover", className)}
      style={{ objectPosition: p.position || "50% 50%" }}
    />
  );
}

/** Short attribution line required by the CC BY / CC BY-SA licenses. */
export function PhotoCredit({ slug, label, className }: { slug: string; label: string; className?: string }) {
  const p: Photo | undefined = photoFor(slug);
  if (!p) return null;
  return (
    <p className={cn("text-[11px] leading-snug", className)}>
      {label}: <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-white">{p.author || "Wikimedia Commons"}</a>
      {" · "}
      {p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline decoration-dotted underline-offset-2 hover:text-white">{p.license}</a> : p.license}
      {" · Wikimedia Commons"}
    </p>
  );
}
