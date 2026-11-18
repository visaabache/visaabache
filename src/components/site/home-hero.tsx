import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { heroPhotoSrc, type HeroPhotoName } from "@/lib/hero-photos";
import { cn } from "@/lib/utils";

/** Slightly wobbly hand-drawn stroke, used as an underline under the headline. */
export function HandUnderline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M3 10.5c38-5.2 74-6.8 112-5.6 30 .9 52 3.6 84 2.9 34-.7 62-3.9 98-5.3" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M40 13.4c46-3.1 104-3.6 168-1.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

function Print({ name, caption, alt, className, r, tr, delay, priority }: { name: HeroPhotoName; caption: string; alt: string; className: string; r: number; tr?: number; delay: number; priority?: boolean }) {
  return (
    <figure className={cn("print", className)} style={{ ["--r" as string]: `${r}deg`, ["--tr" as string]: `${tr ?? -r * 0.8}deg`, animationDelay: `${delay}s` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroPhotoSrc(name, 360)}
        srcSet={`${heroPhotoSrc(name, 360)} 360w, ${heroPhotoSrc(name, 640)} 640w`}
        sizes="(min-width: 1024px) 240px, 42vw"
        alt={alt}
        width={360}
        height={450}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
      <figcaption>{caption}</figcaption>
      <span className="tape" aria-hidden />
    </figure>
  );
}

/** Round "passport stamp" with circular text, drawn as SVG. */
function Stamp({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      <defs>
        <path id="stamp-ring" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="50" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="60" cy="60" r="31" strokeWidth="1.5" />
      </g>
      <text fill="currentColor" fontSize="9.5" fontWeight="700" letterSpacing="2.2" fontFamily="Inter Variable, sans-serif" direction="ltr" unicodeBidi="bidi-override">
        <textPath href="#stamp-ring">VISA ABACHE · MAROC · ✈ · VISA ABACHE · MAROC · ✈ ·</textPath>
      </text>
      <text x="60" y="66" textAnchor="middle" fill="currentColor" fontSize="17" className="font-hand">{label}</text>
    </svg>
  );
}

/**
 * Home hero: warm "paper" background, handwritten welcome, and a collage of real travel photos (beach, family
 * at the sea, green mountains, old-town street) as taped prints — a human, scrapbook feel instead of glowing
 * gradients. Photos: Pixabay (see /credits).
 */
export function HomeHero({ t, actions, search, trust }: {
  t: { welcome: string; title: string; highlight: string; subtitle: string; beach: string; family: string; green: string; city: string; stamp: string; photosAlt: string };
  actions: ReactNode;
  search: ReactNode;
  trust: string[];
}) {
  return (
    <section className="paper relative overflow-hidden text-navy-900">
      <div className="container relative grid items-center gap-10 pb-28 pt-10 sm:pt-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-6 lg:pb-32 lg:pt-16">
        <div className="relative z-10 min-w-0">
          <p className="inline-block -rotate-2 font-hand text-[1.7rem] leading-none text-clay-500 sm:text-3xl">{t.welcome}</p>
          <h1 className="mt-4 font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight rtl:leading-[1.4] sm:text-[3.4rem] xl:text-[3.9rem]">
            {t.title}
            <br />
            <span className="hand-underline text-navy-700">{t.highlight}</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">{t.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
          <div className="relative z-20 mt-7">{search}</div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
            {trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f8a8a]/12 text-[#1f7a7a]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div role="img" aria-label={t.photosAlt} className="relative mx-auto aspect-[1/1.12] w-full max-w-[560px] lg:max-w-none">
          {/* hand-drawn flight path behind the prints */}
          <svg viewBox="0 0 500 500" aria-hidden className="absolute inset-0 h-full w-full text-navy-300">
            <path d="M18 455C80 380 60 300 150 270s170 40 230-30 40-160 100-215" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="7 9" strokeLinecap="round" />
            <path d="M462 34l14-4-6 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Print name="beach" caption={t.beach} alt="" className="start-0 top-[3%] z-[2] w-[40%]" r={-6} delay={0.1} priority />
          <Print name="green" caption={t.green} alt="" className="end-[1%] top-0 z-[1] w-[38%]" r={4.5} delay={0.25} priority />
          <Print name="family-sea" caption={t.family} alt="" className="start-[7%] top-[53%] z-[3] w-[38%]" r={3.5} tr={-6} delay={0.4} />
          <Print name="old-town" caption={t.city} alt="" className="end-[4%] top-[48%] z-[2] w-[40%]" r={-3.5} delay={0.55} />
          <div className="absolute start-[39%] top-[37%] z-[4] aspect-square w-[21%] -rotate-12 text-clay-500/85 mix-blend-multiply">
            <Stamp label={t.stamp} />
          </div>
        </div>
      </div>

      {/* hand-cut edge into the white page below */}
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-0 h-10 w-full text-white sm:h-14">
        <path d="M0 38c120-14 214 10 352 4 150-7 210-32 372-30 160 2 240 34 410 30 130-3 200-22 306-18v66H0z" fill="currentColor" />
      </svg>
    </section>
  );
}

export function HeroArrow() {
  return <ArrowRight className="rtl-flip h-4 w-4" />;
}
