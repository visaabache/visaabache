import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/misc";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="paper relative min-h-[70vh] overflow-hidden py-14">
      <div className="container relative flex justify-center">
        <Card className="relative w-full max-w-md animate-pop-in rounded-3xl p-7 shadow-premium sm:p-9">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-gold-400"><ShieldCheck className="h-6 w-6" /></div>
          <h1 className="font-display text-3xl font-semibold text-navy-800">{title}</h1>
          {subtitle && <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>}
          {children}
          {footer && <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">{footer}</div>}
        </Card>
      </div>
    </section>
  );
}
