"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";

/**
 * Submits through a server action without React's automatic form reset, so fields keep the values
 * the admin just saved. Shows the result inline and refreshes server data afterwards.
 */
export function AdminForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
  successMessage = "Saved",
  quiet = false,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  successMessage?: string;
  /** No inline status (for icon buttons); errors are shown in an alert. */
  quiet?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>(null);
  useEffect(() => {
    if (!result?.ok) return;
    const t = setTimeout(() => setResult(null), 3500);
    return () => clearTimeout(t);
  }, [result]);
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          try {
            const r = await action(fd);
            if (quiet && r?.error) window.alert(r.error);
            setResult(r ?? { ok: true });
            if (r?.redirect) router.push(r.redirect);
            else router.refresh();
            if (r?.ok && resetOnSuccess) form.reset();
          } catch (err) {
            setResult({ error: err instanceof Error && err.message !== "FORBIDDEN" ? err.message : "Not allowed or failed. Reload and try again." });
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {!quiet && <div aria-live="polite" className="contents">
        {pending && <span className="ms-3 inline-flex items-center gap-1 text-sm text-charcoal-500"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span>}
        {!pending && result?.error && <p className="mt-3 rounded-lg bg-terracotta-50 px-3 py-2 text-sm text-terracotta-700" role="alert">{result.error}</p>}
        {!pending && result?.ok && <span className="ms-3 text-sm font-medium text-emerald-700">✓ {result.message || successMessage}</span>}
      </div>}
    </form>
  );
}

const LANGS = [
  { code: "fr", label: "FR", dir: "ltr" },
  { code: "ar", label: "عربي", dir: "rtl" },
  { code: "en", label: "EN", dir: "ltr" },
] as const;

type I18nValue = Partial<Record<"fr" | "ar" | "en", string>> | null | undefined;

/** One field in three languages. All inputs stay in the form, so every language is saved at once. */
export function I18nField({ name, label, value, multiline = false, rows = 3, required = false, hint }: { name: string; label: string; value?: I18nValue; multiline?: boolean; rows?: number; required?: boolean; hint?: string }) {
  const [tab, setTab] = useState<"fr" | "ar" | "en">("fr");
  const v = value || {};
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-charcoal-600">{label}{required && <span className="text-terracotta"> *</span>}</span>
        <div className="flex rounded-full bg-ivory-200 p-0.5 text-xs" role="tablist">
          {LANGS.map((l) => (
            <button key={l.code} type="button" role="tab" aria-selected={tab === l.code} onClick={() => setTab(l.code)} className={`rounded-full px-2.5 py-1 font-semibold ${tab === l.code ? "bg-white shadow-sm" : "text-charcoal-500"}`}>
              {l.label}
              {!v[l.code] && <span className="ms-1 text-terracotta" title="Empty">•</span>}
            </button>
          ))}
        </div>
      </div>
      {LANGS.map((l) => {
        const props = { name: `${name}.${l.code}`, defaultValue: v[l.code] || "", dir: l.dir, lang: l.code, className: `field ${tab === l.code ? "" : "hidden"}`, required: required && l.code === "fr", "aria-label": `${label} (${l.label})` };
        return multiline ? <textarea key={l.code} rows={rows} {...props} /> : <input key={l.code} {...props} />;
      })}
      {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-charcoal-500">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "outline" | "danger" }) {
  const cls = variant === "primary" ? "btn-primary btn-sm" : variant === "danger" ? "btn btn-sm border border-terracotta/40 text-terracotta hover:bg-terracotta hover:text-white" : "btn-outline btn-sm";
  return <button type="submit" className={cls}>{children}</button>;
}

/** A one-button form for row actions (delete, toggle…). */
export function ActionButton({ action, fields, children, confirm, variant = "outline" }: { action: (fd: FormData) => Promise<ActionResult>; fields: Record<string, string>; children: ReactNode; confirm?: string; variant?: "primary" | "outline" | "danger" }) {
  return (
    <AdminForm action={action} confirm={confirm} className="inline-flex items-center" quiet>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton variant={variant}>{children}</SubmitButton>
    </AdminForm>
  );
}

export function Card({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 md:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "blue" | "yellow" }) {
  const t = { neutral: "bg-ivory-200 text-charcoal-600", green: "bg-emerald-50 text-emerald-700", red: "bg-terracotta-50 text-terracotta-700", blue: "bg-majorelle-50 text-majorelle", yellow: "bg-saffron-50 text-saffron-700" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}
