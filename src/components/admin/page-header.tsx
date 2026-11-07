import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-1 p-4 text-sm" aria-label="Pagination">
      {page > 1 && <a href={href(page - 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-100">‹</a>}
      <span className="px-3 text-slate-500">{page} / {pages}</span>
      {page < pages && <a href={href(page + 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-100">›</a>}
    </nav>
  );
}
