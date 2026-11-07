"use client";
import type { ReactNode } from "react";

/** A tiny form that asks for confirmation before running a server action (delete, archive…). */
export function ConfirmForm({ action, confirm, children, className }: { action: () => Promise<void>; confirm: string; children: ReactNode; className?: string }) {
  return (
    <form action={action} className={className} onSubmit={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>
      {children}
    </form>
  );
}
