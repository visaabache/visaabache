import { cn } from "@/lib/utils";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} dir="ltr">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="14" fill={light ? "#ffffff" : "#102747"} />
        <path d="M14 18h8l10 24 10-24h8L36 48h-8z" fill="#C9A45C" />
      </svg>
      <span className="leading-none">
        <span className={cn("block text-[17px] font-extrabold tracking-[0.18em]", light ? "text-white" : "text-navy-800")}>
          VISA <span className="text-gold-500">ABACHE</span>
        </span>
      </span>
    </span>
  );
}
