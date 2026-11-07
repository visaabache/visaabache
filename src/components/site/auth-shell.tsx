import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/misc";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="bg-hero relative min-h-[70vh] py-14">
      <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="container relative flex justify-center">
        <Card className="w-full max-w-md p-7 sm:p-9">
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
