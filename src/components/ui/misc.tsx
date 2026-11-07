import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-soft", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4", className)}>
      <div>
        <h3 className="font-semibold text-navy-800">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  navy: "bg-navy-50 text-navy-700 ring-navy-200",
  gold: "bg-gold-50 text-gold-800 ring-gold-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "slate", className, style, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", badgeTones[tone], className)} style={style} {...props} />;
}

export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${color}1a`, color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const alertTones = {
  info: { cls: "border-sky-200 bg-sky-50 text-sky-900", Icon: Info },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", Icon: CheckCircle2 },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-900", Icon: TriangleAlert },
  error: { cls: "border-red-200 bg-red-50 text-red-900", Icon: AlertCircle },
};

export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof alertTones; title?: ReactNode; children?: ReactNode; className?: string }) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", cls, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center, className, light }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; center?: boolean; className?: string; light?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("mb-2 text-xs font-bold uppercase tracking-[0.2em]", light ? "text-gold-300" : "text-gold-600")}>{eyebrow}</p>}
      <h2 className={cn("font-display text-3xl font-semibold leading-tight sm:text-4xl", light ? "text-white" : "text-navy-800")}>{title}</h2>
      {subtitle && <p className={cn("mt-3 text-base leading-relaxed", light ? "text-navy-100" : "text-slate-600")}>{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      {icon && <div className="text-slate-400">{icon}</div>}
      <p className="font-medium text-slate-700">{title}</p>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "navy", href, hint }: { label: ReactNode; value: ReactNode; icon?: ReactNode; tone?: "navy" | "gold" | "red" | "green" | "amber"; href?: string; hint?: ReactNode }) {
  const tones = {
    navy: "bg-navy-50 text-navy-700",
    gold: "bg-gold-50 text-gold-700",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const inner = (
    <Card className={cn("flex items-center gap-4 p-5", href && "transition hover:-translate-y-0.5 hover:shadow-premium")}>
      {icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-navy-800">{value}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </Card>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

export function Flag({ code, className, alt = "" }: { code: string; className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code.toUpperCase()}.svg`} alt={alt} loading="lazy" className={cn("inline-block rounded-[3px] object-cover shadow-sm ring-1 ring-black/5", className)} />;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-start [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_thead]:bg-slate-50 [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 [&_tbody_tr:hover]:bg-slate-50/60">
        {children}
      </table>
    </div>
  );
}

export function Prose({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose prose-slate max-w-none prose-headings:font-display prose-headings:text-navy-800 prose-a:text-navy-700 prose-strong:text-navy-800 prose-li:my-0.5", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
