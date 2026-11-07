import { cn } from "@/lib/utils";

/** Slowly drifting, blurred colour fields — the "living" background of hero sections. */
export function Aurora({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  const dark = variant === "dark";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn("absolute -left-[10%] -top-[30%] h-[70vmax] w-[70vmax] rounded-full blur-3xl animate-aurora", dark ? "bg-[radial-gradient(circle,rgba(47,79,133,.75),transparent_60%)]" : "bg-[radial-gradient(circle,rgba(125,151,194,.35),transparent_60%)]")} />
      <div className={cn("absolute -right-[15%] -top-[20%] h-[55vmax] w-[55vmax] rounded-full blur-3xl animate-aurora-slow", dark ? "bg-[radial-gradient(circle,rgba(201,164,92,.38),transparent_60%)]" : "bg-[radial-gradient(circle,rgba(201,164,92,.28),transparent_60%)]")} />
      <div className={cn("absolute -bottom-[35%] left-[20%] h-[60vmax] w-[60vmax] rounded-full blur-3xl animate-aurora [animation-delay:-7s]", dark ? "bg-[radial-gradient(circle,rgba(14,116,144,.35),transparent_60%)]" : "bg-[radial-gradient(circle,rgba(14,116,144,.12),transparent_60%)]")} />
    </div>
  );
}
