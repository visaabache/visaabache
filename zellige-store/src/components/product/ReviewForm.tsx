"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/actions/public";
import { useStore } from "../providers";

export function ReviewForm({ productId }: { productId: string }) {
  const { d, locale } = useStore();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState(submitReview, null);
  if (state?.ok) return <p className="card bg-emerald-50 p-5 text-sm text-emerald-700">{d.product.reviewThanks}</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-outline">{d.product.writeReview}</button>;
  return (
    <form action={action} className="card space-y-4 p-5 md:p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="rating" value={rating} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <fieldset>
        <legend className="label">{d.product.rating}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i}/5`} aria-pressed={i === rating}>
              <Star className={`h-7 w-7 ${i <= rating ? "fill-saffron text-saffron" : "text-charcoal/25"}`} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label">{d.product.yourName}</span><input name="name" required maxLength={80} className="field" autoComplete="name" /></label>
        <label><span className="label">{d.product.yourEmail}</span><input name="email" type="email" maxLength={200} className="field" autoComplete="email" /></label>
      </div>
      <label className="block"><span className="label">{d.product.reviewTitle}</span><input name="title" maxLength={120} className="field" /></label>
      <label className="block"><span className="label">{d.product.reviewBody}</span><textarea name="body" required minLength={5} maxLength={3000} rows={4} className="field" /></label>
      {state?.error && <p className="text-sm text-terracotta" role="alert">{state.error === "rate" ? d.account.tooMany : d.common.error}</p>}
      <button className="btn-primary" disabled={pending}>{d.product.submitReview}</button>
    </form>
  );
}
