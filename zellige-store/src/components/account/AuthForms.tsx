"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, updateProfile } from "@/actions/account";
import { useStore } from "../providers";

function errorText(d: ReturnType<typeof useStore>["d"], e?: string) {
  if (!e) return null;
  return e === "rate" ? d.account.tooMany : e === "exists" ? d.account.exists : e === "invalid" ? d.account.invalid : d.common.error;
}

export function LoginForm({ next }: { next?: string }) {
  const { d, locale, href } = useStore();
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block"><span className="label">{d.account.email}</span><input name="email" type="email" required autoComplete="email" className="field" /></label>
      <label className="block"><span className="label">{d.account.password}</span><input name="password" type="password" required autoComplete="current-password" className="field" /></label>
      {state?.error && <p className="text-sm text-terracotta" role="alert">{errorText(d, state.error)}</p>}
      <button className="btn-primary w-full" disabled={pending}>{d.account.signIn}</button>
      <p className="text-center text-sm text-charcoal-600">{d.account.noAccount} <Link href={href(`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`)} className="link font-semibold text-majorelle">{d.account.register}</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { d, locale, href } = useStore();
  const [state, action, pending] = useActionState(register, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block"><span className="label">{d.account.name}</span><input name="name" required autoComplete="name" className="field" /></label>
      <label className="block"><span className="label">{d.account.email}</span><input name="email" type="email" required autoComplete="email" className="field" /></label>
      <label className="block"><span className="label">{d.account.phone}</span><input name="phone" type="tel" autoComplete="tel" dir="ltr" className="field text-start" /></label>
      <label className="block"><span className="label">{d.account.password}</span><input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" /><span className="mt-1 block text-xs text-charcoal-500">{d.account.passwordHint}</span></label>
      {state?.error && <p className="text-sm text-terracotta" role="alert">{errorText(d, state.error)}</p>}
      <button className="btn-primary w-full" disabled={pending}>{d.account.register}</button>
      <p className="text-center text-sm text-charcoal-600">{d.account.haveAccount} <Link href={href("/account/login")} className="link font-semibold text-majorelle">{d.account.signIn}</Link></p>
    </form>
  );
}

export function ProfileForm({ user }: { user: { name: string; phone: string | null; city: string | null; address: string | null } }) {
  const { d } = useStore();
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">{d.account.name}</span><input name="name" required defaultValue={user.name} className="field" /></label>
      <label className="block"><span className="label">{d.account.phone}</span><input name="phone" defaultValue={user.phone || ""} dir="ltr" className="field text-start" /></label>
      <label className="block"><span className="label">{d.checkout.city}</span><input name="city" defaultValue={user.city || ""} className="field" /></label>
      <label className="block"><span className="label">{d.checkout.address}</span><input name="address" defaultValue={user.address || ""} className="field" /></label>
      <div className="flex items-center gap-3">
        <button className="btn-primary btn-sm" disabled={pending}>{d.account.save}</button>
        {state?.ok && <span className="text-sm text-emerald-700">{d.account.saved}</span>}
      </div>
    </form>
  );
}
