"use client";
import { useActionState } from "react";
import Link from "@/components/ui/link";
import type { ActionState } from "@/lib/action-state";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

export function LoginForm({ action, next, labels, forgotHref, area }: { action: Action; next?: string; forgotHref: string; area?: "admin"; labels: { email: string; password: string; forgot: string; submit: string } }) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      {area && <input type="hidden" name="area" value={area} />}
      <Field label={labels.email} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" defaultValue={typeof state.data?.email === "string" ? state.data.email : undefined} />
      </Field>
      <Field label={labels.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <div className="text-end text-sm">
        <Link href={forgotHref} className="text-navy-700 hover:underline">{labels.forgot}</Link>
      </div>
      <SubmitButton size="lg" variant="navy" className="w-full">{labels.submit}</SubmitButton>
    </form>
  );
}

export function RegisterForm({ action, next, labels, termsHref, privacyHref }: {
  action: Action; next?: string; termsHref: string; privacyHref: string;
  labels: { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string; passwordHint: string; accept: string; marketing: string; submit: string; terms: string; privacy: string };
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const fe = state.fieldErrors || {};
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={labels.firstName} htmlFor="firstName" required error={fe.firstName}><Input id="firstName" name="firstName" required autoComplete="given-name" /></Field>
        <Field label={labels.lastName} htmlFor="lastName" required error={fe.lastName}><Input id="lastName" name="lastName" required autoComplete="family-name" /></Field>
      </div>
      <Field label={labels.email} htmlFor="email" required error={fe.email}><Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" /></Field>
      <Field label={labels.phone} htmlFor="phone" required error={fe.phone}><Input id="phone" name="phone" type="tel" required autoComplete="tel" dir="ltr" placeholder="06 XX XX XX XX" /></Field>
      <Field label={labels.password} htmlFor="password" required hint={labels.passwordHint} error={fe.password}><Input id="password" name="password" type="password" required autoComplete="new-password" minLength={10} /></Field>
      <Field label={labels.confirmPassword} htmlFor="confirmPassword" required error={fe.confirmPassword}><Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" /></Field>
      <Checkbox name="acceptTerms" required label={<>{labels.accept} (<a href={termsHref} target="_blank" className="underline">{labels.terms}</a>, <a href={privacyHref} target="_blank" className="underline">{labels.privacy}</a>)</>} />
      <Checkbox name="marketingOptIn" label={labels.marketing} />
      <SubmitButton size="lg" variant="navy" className="w-full">{labels.submit}</SubmitButton>
    </form>
  );
}

export function SimpleAuthForm({ action, fields, submit, hidden }: { action: Action; submit: string; hidden?: Record<string, string>; fields: { name: string; label: string; type: string; autoComplete?: string; hint?: string }[] }) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  if (state.ok) return <Alert tone="success">{state.message}{state.redirectTo && <> <a className="font-semibold underline" href={state.redirectTo}>→</a></>}</Alert>;
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      {Object.entries(hidden || {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={f.name} required hint={f.hint}>
          <Input id={f.name} name={f.name} type={f.type} required autoComplete={f.autoComplete} dir={f.type === "email" ? "ltr" : undefined} />
        </Field>
      ))}
      <SubmitButton size="lg" variant="navy" className="w-full">{submit}</SubmitButton>
    </form>
  );
}
