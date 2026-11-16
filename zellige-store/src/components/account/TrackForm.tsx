"use client";

import { useActionState } from "react";
import { trackOrder } from "@/actions/public";
import { useStore } from "../providers";

export function TrackForm() {
  const { d, locale } = useStore();
  const [state, action, pending] = useActionState(trackOrder, null);
  return (
    <form action={action} className="card mt-8 space-y-4 p-6">
      <input type="hidden" name="locale" value={locale} />
      <label className="block"><span className="label">{d.order.orderNumber}</span><input name="number" required placeholder="DZ-261116-ABCDE" dir="ltr" className="field text-start uppercase" /></label>
      <label className="block"><span className="label">{d.order.emailOrPhone}</span><input name="contact" required className="field" /></label>
      {state?.error && <p className="text-sm text-terracotta" role="alert">{state.error === "rate" ? d.account.tooMany : d.order.notFound}</p>}
      <button className="btn-primary w-full" disabled={pending}>{d.order.find}</button>
    </form>
  );
}
