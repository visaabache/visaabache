"use client";

import { useActionState } from "react";
import { adminLogin } from "@/actions/account";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block"><span className="label">Email</span><input name="email" type="email" required autoComplete="username" className="field" /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" required autoComplete="current-password" className="field" /></label>
      {state?.error && <p className="text-sm text-terracotta" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>Sign in</button>
    </form>
  );
}
