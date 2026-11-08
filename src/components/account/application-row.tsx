import Link from "@/components/ui/link";
import { ChevronRight } from "lucide-react";
import type { ApplicationStatus, Country } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { Badge, Flag, StatusBadge } from "@/components/ui/misc";

type A = { id: string; reference: string; isDraft: boolean; createdAt: Date; submittedAt: Date | null; country: Country; status: ApplicationStatus; documentRequests?: unknown[] };

export function ApplicationRow({ a, locale, t }: { a: A; locale: Locale; t: Dictionary }) {
  const href = a.isDraft ? `/${locale}/apply?draft=${a.id}` : `/${locale}/account/applications/${a.id}`;
  return (
    <li>
      <Link href={href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
        <Flag code={a.country.isoCode} className="h-7 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-800">{tr(a.country.name, locale)}</p>
          <p className="font-mono text-xs text-slate-500">{a.reference} · {formatDate(a.submittedAt || a.createdAt, locale)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {a.isDraft ? <Badge tone="slate">{t.account.draft} · {t.account.continueDraft}</Badge> : <StatusBadge label={tr(a.status.label, locale)} color={a.status.color} />}
          {!!a.documentRequests?.length && <Badge tone="amber">{t.account.requestedDocuments}: {a.documentRequests.length}</Badge>}
        </div>
        <ChevronRight className="rtl-flip h-4 w-4 text-slate-300" />
      </Link>
    </li>
  );
}
