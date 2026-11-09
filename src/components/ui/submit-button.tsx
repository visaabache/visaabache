"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./button";

/** `pending` can be passed explicitly by forms that submit through a transition instead of a form action. */
export function SubmitButton({ children, pendingText, pending: pendingProp, ...props }: ComponentProps<typeof Button> & { pendingText?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = Boolean(pendingProp || status.pending);
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
