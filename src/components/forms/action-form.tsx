"use client";
import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: ReactNode;
  submitVariant?: "primary" | "navy" | "outline" | "danger" | "ghost";
  submitSize?: "sm" | "md" | "lg";
  className?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
  confirm?: string;
  hideSubmit?: boolean;
  inline?: boolean;
  encType?: "multipart/form-data";
  footer?: ReactNode;
};

/*
 * Admin/account form bound to a server action.
 * Submission goes through onSubmit + startTransition rather than letting React run the form action: React 19
 * resets every field of a form after its action completes, which put edit forms (e.g. the status dropdown) back to
 * their previous values after a save — and saving again would have reverted the change. Fields now keep what the
 * user entered; forms with resetOnSuccess are cleared explicitly. `action` stays on the form for no-JS submits.
 */
export function ActionForm({ action, children, submitLabel, submitVariant = "navy", submitSize = "md", className, resetOnSuccess, successMessage, confirm, hideSubmit, inline, footer }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (state.redirectTo) router.push(state.redirectTo);
    else if (state.ok) router.refresh();
  }, [state, resetOnSuccess, router]);

  const fieldErrors = Object.entries(state.fieldErrors || {}).filter(([, v]) => v && v.length);

  return (
    <form
      ref={ref}
      action={formAction}
      className={cn(inline ? "flex flex-wrap items-end gap-2" : "space-y-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending || (confirm && !window.confirm(confirm))) return;
        const form = e.currentTarget;
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        let fd: FormData;
        try {
          fd = new FormData(form, submitter);
        } catch {
          fd = new FormData(form);
        }
        startTransition(() => formAction(fd));
      }}
    >
      {!inline && state.error && (
        <Alert tone="error">
          {state.error}
          {fieldErrors.length > 0 && (
            <ul className="mt-1 list-disc ps-5">
              {fieldErrors.map(([k, v]) => (
                <li key={k}>
                  <span className="font-mono text-xs">{k}</span>: {v![0]}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {!inline && state.ok && (state.message || successMessage) && <Alert tone="success">{state.message || successMessage}</Alert>}
      {children}
      {!hideSubmit && (
        <div className={cn(!inline && "flex items-center gap-3")}>
          <SubmitButton variant={submitVariant} size={submitSize} pending={pending}>
            {submitLabel ?? "Save"}
          </SubmitButton>
          {footer}
        </div>
      )}
      {inline && state.error && <p className="w-full text-xs font-medium text-red-600">{state.error}</p>}
      {inline && state.ok && (state.message || successMessage) && <p className="w-full text-xs font-medium text-emerald-600">{state.message || successMessage}</p>}
    </form>
  );
}
