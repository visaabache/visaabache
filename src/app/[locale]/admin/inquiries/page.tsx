import { Trash2 } from "lucide-react";
import type { InquiryStatus } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { whatsappLink } from "@/lib/utils";
import { deleteInquiryAction, updateInquiryAction } from "@/actions/admin/crm";
import { Badge, Card, EmptyState } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

const STATUSES: InquiryStatus[] = ["NEW", "IN_PROGRESS", "CLOSED"];

export default async function Inquiries({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const ti = t.admin.inquiries;
  await requireStaff(locale, "inquiries.manage");
  const status = STATUSES.includes(sp.status as InquiryStatus) ? (sp.status as InquiryStatus) : undefined;
  const items = await prisma.inquiry.findMany({ where: status ? { status } : { status: { not: "CLOSED" } }, include: { service: true }, orderBy: { createdAt: "desc" }, take: 100 });
  const tone = { NEW: "gold", IN_PROGRESS: "blue", CLOSED: "slate" } as const;
  return (
    <div>
      <AdminPageHeader title={ti.title} />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="?" className={cn("rounded-full px-4 py-1.5 text-sm", !status ? "bg-navy-800 text-white" : "bg-white")}>{ti.status.NEW} + {ti.status.IN_PROGRESS}</a>
        {STATUSES.map((s) => <a key={s} href={`?status=${s}`} className={cn("rounded-full px-4 py-1.5 text-sm", status === s ? "bg-navy-800 text-white" : "bg-white")}>{ti.status[s]}</a>)}
      </div>
      {items.length === 0 ? <EmptyState title={t.common.noResults} /> : (
        <div className="space-y-4">
          {items.map((q) => {
            const wa = whatsappLink(q.phone, `Bonjour ${q.name.split(" ")[0]}, `);
            return (
              <Card key={q.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-800">{q.subject || ti.type[q.type]}</p>
                    <p className="text-sm text-slate-500">{q.name} · <a className="underline" href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject || ""}`)}`}>{q.email}</a>{q.phone ? <> · <span dir="ltr">{q.phone}</span></> : null} · {q.locale.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="navy">{ti.type[q.type]}</Badge>
                    {q.service && <Badge>{tr(q.service.name, locale)}</Badge>}
                    <Badge tone={tone[q.status]}>{ti.status[q.status]}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(q.createdAt, locale, true)}</span>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm">{q.message}</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <ActionForm action={updateInquiryAction.bind(null, locale, q.id)} inline submitLabel={t.common.save} submitSize="sm">
                    <Select name="status" defaultValue={q.status} className="h-9 w-40">{STATUSES.map((s) => <option key={s} value={s}>{ti.status[s]}</option>)}</Select>
                    <Input name="internalNote" defaultValue={q.internalNote || ""} placeholder={ti.internalNote} className="h-9 w-72" />
                  </ActionForm>
                  <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject || "VISA ABACHE"}`)}`} className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-sm">{ti.replyEmail}</a>
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>}
                  <ConfirmForm action={deleteInquiryAction.bind(null, locale, q.id)} confirm={t.admin.content.deleteConfirm}><button className="rounded-lg p-2 text-slate-400 hover:text-red-600" aria-label={t.common.delete}><Trash2 className="h-4 w-4" /></button></ConfirmForm>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
