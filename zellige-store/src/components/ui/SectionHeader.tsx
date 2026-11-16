import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({ eyebrow, title, text, href, linkLabel, center = false }: { eyebrow?: string; title: string; text?: string; href?: string; linkLabel?: string; center?: boolean }) {
  return (
    <div className={`mb-8 flex flex-col gap-3 md:mb-10 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={center ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {text && <p className="mt-3 text-charcoal-600">{text}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-majorelle">
          {linkLabel}
          <ArrowRight className="rtl-flip h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-charcoal-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? <Link href={it.href} className="hover:text-charcoal">{it.label}</Link> : <span aria-current="page" className="text-charcoal-600">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
