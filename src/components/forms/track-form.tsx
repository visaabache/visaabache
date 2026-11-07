"use client";
import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { Field, Input } from "@/components/ui/form";
import { Alert, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

type Labels = { reference: string; placeholder: string; email: string; button: string; currentStatus: string; submittedOn: string; loginForMore: string; login: string; destination: string };

export function TrackForm({ action, labels, defaultRef, loginHref }: { action: (p: ActionState, f: FormData) => Promise<ActionState>; labels: Labels; defaultRef?: string; loginHref: string }) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const d = state.data as Record<string, string> | undefined;
  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <Field label={labels.reference} htmlFor="ref" required>
          <Input id="ref" name="reference" required placeholder={labels.placeholder} defaultValue={defaultRef} dir="ltr" className="font-mono uppercase" />
        </Field>
        <Field label={labels.email} htmlFor="tr-email" required>
          <Input id="tr-email" name="email" type="email" required dir="ltr" autoComplete="email" />
        </Field>
        <SubmitButton size="lg" className="w-full">{labels.button}</SubmitButton>
      </form>
      {state.ok && d && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5" aria-live="polite">
          <p className="font-mono text-sm text-slate-500">{d.reference} · {labels.destination}: {d.destination}</p>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{labels.currentStatus}</p>
            <div className="mt-1"><StatusBadge label={d.status} color={d.color} /></div>
            {d.statusDescription && <p className="mt-2 text-sm text-slate-600">{d.statusDescription}</p>}
          </div>
          <p className="text-sm text-slate-500">{labels.submittedOn}: {d.submittedAt}</p>
          <p className="text-sm">{labels.loginForMore} <a href={loginHref} className="font-semibold text-navy-700 underline">{labels.login}</a></p>
        </div>
      )}
    </div>
  );
}
