import { BadgeCheck, CalendarCheck, FileCheck2, Plane, ShieldCheck } from "lucide-react";

type Labels = { status: string; statusValue: string; docs: string; next: string; secure: string; example: string };

/**
 * Animated hero illustration (SVG + CSS, no GIF/video): a rotating wireframe globe, a plane flying along
 * dotted routes from Morocco, pulsing city pins and floating glass status cards.
 */
export function HeroVisual({ labels, flags, more }: { labels: Labels; flags: string[]; more: number }) {
  // Casablanca → Paris → Montréal arc, and Casablanca → Dubai arc (stylised coordinates in a 400×400 box)
  const route1 = "M168 232 C 150 150, 220 120, 232 150 S 120 70, 70 120";
  const route2 = "M168 232 C 230 250, 300 210, 318 190";
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* glow */}
      <div className="absolute inset-[12%] rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
      <svg viewBox="0 0 400 400" className="relative h-full w-full" role="img" aria-label="VISA ABACHE">
        <defs>
          <radialGradient id="globe" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#2f4f85" />
            <stop offset="55%" stopColor="#172f56" />
            <stop offset="100%" stopColor="#07111f" />
          </radialGradient>
          <linearGradient id="gold" x1="0" x2="1">
            <stop offset="0%" stopColor="#f4ead4" />
            <stop offset="100%" stopColor="#c9a45c" />
          </linearGradient>
          <clipPath id="globe-clip"><circle cx="200" cy="200" r="130" /></clipPath>
          <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="rgba(255,255,255,.18)" /></pattern>
        </defs>

        {/* outer orbit rings */}
        <g className="origin-center animate-spin-slow" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="178" fill="none" stroke="rgba(201,164,92,.35)" strokeWidth="1" strokeDasharray="2 9" />
          <circle cx="200" cy="22" r="4" fill="#c9a45c" />
        </g>
        <circle cx="200" cy="200" r="158" fill="none" stroke="rgba(255,255,255,.08)" />

        {/* globe */}
        <circle cx="200" cy="200" r="130" fill="url(#globe)" />
        <g clipPath="url(#globe-clip)">
          <rect x="60" y="60" width="280" height="280" fill="url(#dots)" opacity=".9" />
          {/* latitudes */}
          {[-80, -40, 0, 40, 80].map((y) => (
            <ellipse key={y} cx="200" cy={200 + y} rx={Math.sqrt(130 * 130 - y * y)} ry={14} fill="none" stroke="rgba(255,255,255,.12)" />
          ))}
          {/* rotating meridians */}
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx="200" cy="200" rx="130" ry="130" fill="none" stroke="rgba(201,164,92,.28)" strokeWidth="1">
              <animate attributeName="rx" values="130;0;130" dur="12s" begin={`${-i * 3}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
        </g>
        <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(255,255,255,.18)" />

        {/* routes */}
        <path d={route1} fill="none" stroke="url(#gold)" strokeWidth="1.6" className="flight-path" />
        <path d={route2} fill="none" stroke="url(#gold)" strokeWidth="1.6" className="flight-path" />

        {/* city pins (pulsing) */}
        {[
          [168, 232],
          [232, 150],
          [70, 120],
          [318, 190],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="rgba(201,164,92,.25)">
              <animate attributeName="r" values="4;14;4" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values=".8;0;.8" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="3.5" fill={i === 0 ? "#c9a45c" : "#fff"} />
          </g>
        ))}

        {/* planes flying along the routes */}
        <g className="motion-path">
          <g>
            <path d="M11 0 L-1 -2.2 L-5 -9 L-7.5 -9 L-4.6 -2.2 L-8.5 -2.2 L-10.5 -5 L-12 -5 L-11 0 L-12 5 L-10.5 5 L-8.5 2.2 L-4.6 2.2 L-7.5 9 L-5 9 L-1 2.2 Z" fill="#fff" />
            <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path={route1} />
          </g>
          <g>
            <path d="M11 0 L-1 -2.2 L-5 -9 L-7.5 -9 L-4.6 -2.2 L-8.5 -2.2 L-10.5 -5 L-12 -5 L-11 0 L-12 5 L-10.5 5 L-8.5 2.2 L-4.6 2.2 L-7.5 9 L-5 9 L-1 2.2 Z" fill="#e9d4a9" transform="scale(.8)" />
            <animateMotion dur="5s" begin="1.5s" repeatCount="indefinite" rotate="auto" path={route2} />
          </g>
        </g>
      </svg>

      {/* floating glass cards */}
      <div className="glass absolute -left-1 top-[8%] w-[56%] max-w-[250px] animate-float rounded-2xl p-2.5 text-white sm:-left-6 sm:p-3.5">
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-gold-300 sm:gap-2 sm:text-[11px]">
          <FileCheck2 className="h-3.5 w-3.5" /> {labels.status}
          <span className="ms-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-navy-100">{labels.example}</span>
        </div>
        <p className="mt-1 text-xs font-semibold sm:mt-1.5 sm:text-sm">{labels.statusValue}</p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-progress-fill rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
        </div>
      </div>

      <div className="glass absolute right-0 top-[44%] flex animate-float-slow items-center gap-2 rounded-2xl px-2.5 py-2 text-white sm:-right-6 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 sm:h-8 sm:w-8">
          <span className="absolute inset-0 animate-ping2 rounded-full bg-emerald-400/30" />
          <BadgeCheck className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold sm:text-sm">{labels.docs}</span>
      </div>

      <div className="glass absolute bottom-[10%] left-[2%] flex animate-float items-center gap-2 rounded-2xl px-2.5 py-2 text-white [animation-delay:-3s] sm:left-[6%] sm:gap-2.5 sm:px-3.5 sm:py-2.5">
        <CalendarCheck className="h-4 w-4 text-gold-300" />
        <span className="text-xs font-medium sm:text-sm">{labels.next}</span>
      </div>

      <div className="absolute bottom-[3%] right-[4%] flex animate-float-slow items-center [animation-delay:-4s]">
        {flags.slice(0, 4).map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f} src={`/flags/${f}.svg`} alt="" className="-ms-2 h-7 w-7 rounded-full border-2 border-navy-900 object-cover shadow-lg first:ms-0 sm:h-8 sm:w-8" style={{ zIndex: 10 - i }} />
        ))}
        <span className="glass -ms-2 flex h-8 items-center rounded-full px-2.5 text-xs font-bold text-gold-300"><Plane className="me-1 h-3.5 w-3.5" />+{more}</span>
      </div>

      <div className="absolute right-[6%] top-[1%] flex animate-float items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-800 shadow-premium [animation-delay:-1.5s] sm:right-[14%] sm:px-3 sm:py-1.5 sm:text-xs">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {labels.secure}
      </div>
    </div>
  );
}
