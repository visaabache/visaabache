"use client";
import { useRef, useState, useTransition } from "react";
import { CreditCard, Landmark, Loader2, Wallet } from "lucide-react";
import { startCardPaymentAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";

export function CardPayButton({ locale, invoiceId, label }: { locale: string; invoiceId: string; label: string }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ url: string; params: Record<string, string> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      <Button
        type="button"
        variant="navy"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await startCardPaymentAction(locale, invoiceId);
            if (!r.ok) return setError(r.error || "Error");
            setForm(r.data as { url: string; params: Record<string, string> });
            setTimeout(() => ref.current?.submit(), 50);
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} {label}
      </Button>
      {form && (
        <form ref={ref} method="POST" action={form.url} className="hidden">
          {Object.entries(form.params).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        </form>
      )}
    </>
  );
}

export const PayIcons = { CreditCard, Landmark, Wallet };
