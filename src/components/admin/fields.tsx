import type { ReactNode } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import { Input, Label, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const flagLabel: Record<Locale, string> = { fr: "FR", ar: "AR", en: "EN" };

function val(v: unknown, l: Locale) {
  if (!v || typeof v !== "object") return "";
  const x = (v as Record<string, unknown>)[l];
  if (Array.isArray(x)) return x.join("\n");
  return typeof x === "string" ? x : "";
}

/** One input per language for a localized JSON field (name.fr / name.ar / name.en). */
export function LocalizedInput({ name, label, value, multiline, rows = 3, required, hint, className }: {
  name: string; label: ReactNode; value?: unknown; multiline?: boolean; rows?: number; required?: boolean; hint?: ReactNode; className?: string;
}) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <Label className="mb-0">{label}{required && <span className="text-red-500"> *</span>}</Label>
      <div className={cn("grid gap-2", multiline ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {locales.map((l) => (
          <div key={l} className="relative">
            <span className="pointer-events-none absolute end-2 top-2 rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">{flagLabel[l]}</span>
            {multiline ? (
              <Textarea name={`${name}.${l}`} defaultValue={val(value, l)} rows={rows} dir={l === "ar" ? "rtl" : "ltr"} required={required && l === "fr"} className="pe-10" />
            ) : (
              <Input name={`${name}.${l}`} defaultValue={val(value, l)} dir={l === "ar" ? "rtl" : "ltr"} required={required && l === "fr"} className="pe-10" />
            )}
          </div>
        ))}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </fieldset>
  );
}

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={cn("grid grid-cols-1 gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3", cols === 4 && "sm:grid-cols-2 lg:grid-cols-4")}>{children}</div>;
}
