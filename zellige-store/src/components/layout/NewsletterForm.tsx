"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/actions/public";
import { useStore } from "../providers";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { d, locale } = useStore();
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  if (state?.ok) return <p className={`text-sm font-medium ${tone === "dark" ? "text-saffron" : "text-emerald"}`}>{d.newsletter.thanks}</p>;
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="nl-email">{d.newsletter.placeholder}</label>
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={d.newsletter.placeholder}
          className={`w-full rounded-full px-5 py-3 outline-none ${tone === "dark" ? "border border-white/20 bg-white/5 text-ivory placeholder:text-ivory/50 focus:border-saffron" : "field"}`}
        />
        <button className={tone === "dark" ? "btn bg-saffron text-charcoal hover:bg-saffron-100" : "btn-primary"} disabled={pending}>
          {d.newsletter.subscribe}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-terracotta-100" role="alert">{d.newsletter.invalid}</p>}
    </form>
  );
}
