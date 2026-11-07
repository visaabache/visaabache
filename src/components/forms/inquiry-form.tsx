"use client";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

type Labels = { name: string; email: string; phone: string; subject: string; message: string; consent: string; send: string; privacy: string };

export function InquiryForm({
  action,
  type,
  serviceId,
  labels,
  privacyHref,
  showSubject,
  defaults,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  type: "SERVICE" | "CONTACT" | "CONSULTATION";
  serviceId?: string;
  labels: Labels;
  privacyHref: string;
  showSubject?: boolean;
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center text-emerald-900">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }
  const fe = state.fieldErrors || {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="type" value={type} />
      {serviceId && <input type="hidden" name="serviceId" value={serviceId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.name} htmlFor="inq-name" error={fe.name} required>
          <Input id="inq-name" name="name" required autoComplete="name" defaultValue={defaults?.name} />
        </Field>
        <Field label={labels.phone} htmlFor="inq-phone" error={fe.phone}>
          <Input id="inq-phone" name="phone" type="tel" autoComplete="tel" dir="ltr" defaultValue={defaults?.phone} />
        </Field>
      </div>
      <Field label={labels.email} htmlFor="inq-email" error={fe.email} required>
        <Input id="inq-email" name="email" type="email" required autoComplete="email" dir="ltr" defaultValue={defaults?.email} />
      </Field>
      {showSubject && (
        <Field label={labels.subject} htmlFor="inq-subject" error={fe.subject}>
          <Input id="inq-subject" name="subject" maxLength={160} />
        </Field>
      )}
      <Field label={labels.message} htmlFor="inq-message" error={fe.message} required>
        <Textarea id="inq-message" name="message" required rows={5} maxLength={4000} />
      </Field>
      <Checkbox
        name="consent"
        required
        label={
          <>
            {labels.consent}{" "}
            <a href={privacyHref} className="underline" target="_blank">
              {labels.privacy}
            </a>
          </>
        }
      />
      {fe.consent && <p className="text-xs text-red-600">{fe.consent[0]}</p>}
      <SubmitButton size="lg" className="w-full sm:w-auto">
        {labels.send}
      </SubmitButton>
    </form>
  );
}
