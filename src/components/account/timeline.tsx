import type { Locale } from "@/lib/i18n/config";
import { formatDate, tr } from "@/lib/i18n/localized";

type Entry = { id: string; createdAt: Date; note: string | null; toStatus: { label: unknown; color: string } };

export function StatusTimeline({ entries, locale }: { entries: Entry[]; locale: Locale }) {
  return (
    <ol className="relative space-y-5 border-s-2 border-slate-100 ps-6">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -start-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white" style={{ backgroundColor: e.toStatus.color }} />
          <p className="font-medium text-navy-800">{tr(e.toStatus.label, locale)}</p>
          <p className="text-xs text-slate-400">{formatDate(e.createdAt, locale, true)}</p>
          {e.note && <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
