/** Geometric motifs drawn from the eight-pointed star (khatam) at the heart of zellige. Decorative only. */

export function StarMark({ className = "h-8 w-8", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g transform="translate(24 24)">
        <rect x="-15" y="-15" width="30" height="30" rx="1.5" fill="#1E3F8A" />
        <rect x="-15" y="-15" width="30" height="30" rx="1.5" fill="#1E3F8A" transform="rotate(45)" />
        <rect x="-9.5" y="-9.5" width="19" height="19" fill="#FAF6EE" />
        <rect x="-9.5" y="-9.5" width="19" height="19" fill="#FAF6EE" transform="rotate(45)" />
        <rect x="-5.2" y="-5.2" width="10.4" height="10.4" fill="#B4502F" />
        <rect x="-5.2" y="-5.2" width="10.4" height="10.4" fill="#D6A23A" transform="rotate(45)" />
        <circle r="2.4" fill="#1E6B57" />
      </g>
    </svg>
  );
}

/** A thin divider: line · star · line. */
export function ZelligeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-charcoal/25" />
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
        <g transform="translate(10 10)" fill="#B4502F">
          <rect x="-6" y="-6" width="12" height="12" />
          <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
        </g>
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-charcoal/25" />
    </div>
  );
}

/** Repeating star-and-cross tile as a CSS background. Keep opacity low: products carry the colour. */
export function ZelligePattern({ className = "", color = "#1E3F8A", opacity = 0.08 }: { className?: string; color?: string; opacity?: number }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'><g fill='none' stroke='${color}' stroke-width='1.2'><g transform='translate(28 28)'><rect x='-11' y='-11' width='22' height='22'/><rect x='-11' y='-11' width='22' height='22' transform='rotate(45)'/></g><path d='M0 0l7 7M56 0l-7 7M0 56l7-7M56 56l-7-7M28 0v6M28 56v-6M0 28h6M56 28h-6'/></g></svg>`;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, opacity }}
    />
  );
}
