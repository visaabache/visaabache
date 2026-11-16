"use client";

import { useEffect, useRef } from "react";

export function AutoSubmit({ action, fields, label }: { action: string; fields: Record<string, string>; label: string }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.submit(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <form ref={ref} method="post" action={action} className="mt-6">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className="btn-primary">{label}</button>
    </form>
  );
}
