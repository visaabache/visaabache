"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
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

export function ActionForm({ action, children, submitLabel, submitVariant = "navy", submitSize = "md", className, resetOnSuccess, successMessage, confirm, hideSubmit, inline, footer }: Props) {
  const [state, formAction] = useActionState(action, {} as ActionState);
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
        if (confirm && !window.confirm(confirm)) e.preventDefault();
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
          <SubmitButton variant={submitVariant} size={submitSize}>
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
