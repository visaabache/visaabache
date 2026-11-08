import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, Download, FileText } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatBytes, toNumber, whatsappLink } from "@/lib/utils";
import { createTicketAction, submitReviewAction } from "@/actions/account";
import { Alert, Badge, Card, CardHeader, Flag, StatusBadge } from "@/components/ui/misc";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ActionForm } from "@/components/forms/action-form";
import { DocumentUploadForm } from "@/components/account/upload-form";
import { StatusTimeline } from "@/components/account/timeline";
import { SetWhatsAppMessage } from "@/components/layout/whatsapp";

type ChecklistSnap = { id: string; title: unknown; description: unknown; required: boolean }[];

export default async function MyApplication({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const app = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: {
      country: true, visaType: true, package: true, status: true, testimonial: true,
      history: { include: { toStatus: true }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      documentRequests: { orderBy: { createdAt: "desc" } },
      invoices: { where: { status: { not: "CANCELLED" } } },
    },
  });
  if (!app) notFound();
  if (app.isDraft) {
    return <Alert tone="info">{t.account.draft} — <Link className="font-semibold underline" href={`/${locale}/apply?draft=${app.id}`}>{t.account.continueDraft}</Link></Alert>;
  }
  const [statuses, settings] = await Promise.all([
    prisma.applicationStatus.findMany({ where: { isActive: true, kind: { not: "CANCELLED" } }, orderBy: { sortOrder: "asc" } }),
    getSettings(),
  ]);
  const idx = statuses.findIndex((s) => s.id === app.statusId);
  const progress = app.status.kind === "COMPLETED" ? 100 : idx < 0 ? 0 : Math.round(((idx + 1) / statuses.length) * 100);
  const checklist = (app.checklist as unknown as ChecklistSnap) || [];
  const openRequests = app.documentRequests.filter((r) => r.status === "OPEN");
  const myDocs = app.documents.filter((d) => d.direction === "CUSTOMER_UPLOAD");
  const shared = app.documents.filter((d) => d.direction === "SHARED_BY_STAFF");
  const waText = `${tr(settings.whatsapp.defaultMessage, locale)} — ${t.common.reference}: ${app.reference}`;
  const wa = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, waText) : "";
  const docTone = { PENDING_REVIEW: "slate", ACCEPTED: "green", REJECTED: "red" } as const;

  const uploadOptions = [
    ...openRequests.map((r) => ({ kind: "request" as const, value: r.id, label: `⚠ ${r.title}` })),
    ...checklist.map((c) => ({ kind: "checklist" as const, value: c.id, label: tr(c.title, locale) })),
  ];

  return (
    <div className="space-y-6">
      <SetWhatsAppMessage text={waText} />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <Flag code={app.country.isoCode} className="h-10 w-14" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-navy-800">{tr(app.country.name, locale)}{app.visaType ? ` — ${tr(app.visaType.name, locale)}` : ""}</h1>
            <p className="font-mono text-sm text-slate-500">{app.reference}</p>
          </div>
          <StatusBadge label={tr(app.status.label, locale)} color={app.status.color} />
        </div>
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500"><span>{t.account.progress}</span><span>{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-navy-600 to-gold-500 transition-all" style={{ width: `${progress}%` }} /></div>
          {app.status.description && <p className="mt-3 text-sm text-slate-600">{tr(app.status.description, locale)}</p>}
        </div>
      </Card>

      {openRequests.length > 0 && (
        <Alert tone="warning" title={t.account.requestedDocuments}>
          <ul className="mt-1 list-disc space-y-1 ps-5">
            {openRequests.map((r) => <li key={r.id}><strong>{r.title}</strong>{r.description ? ` — ${r.description}` : ""}{r.dueDate ? ` (${t.account.deadline}: ${formatDate(r.dueDate, locale)})` : ""}</li>)}
          </ul>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={t.account.uploadDocument} />
            <div className="p-5">
              <DocumentUploadForm
                locale={locale}
                applicationId={app.id}
                options={uploadOptions}
                labels={{ label: t.account.documentLabel, file: t.account.chooseFile, upload: t.common.upload, other: t.apply.otherVisa, hint: t.apply.documentsText }}
              />
            </div>
          </Card>

          {checklist.length > 0 && (
            <Card>
              <CardHeader title={t.account.checklist} />
              <ul className="divide-y divide-slate-100">
                {checklist.map((c) => {
                  const docs = myDocs.filter((d) => d.checklistItemId === c.id);
                  const ok = docs.some((d) => d.status !== "REJECTED");
                  return (
                    <li key={c.id} className="flex gap-3 px-5 py-3">
                      {ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="h-5 w-5 shrink-0 text-slate-300" />}
                      <div>
                        <p className="text-sm font-medium text-navy-800">{tr(c.title, locale)} {!c.required && <span className="text-xs font-normal text-slate-400">· {t.country.conditionalDoc}</span>}</p>
                        {c.description ? <p className="text-xs text-slate-500">{tr(c.description, locale)}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title={t.account.yourUploads} />
            {myDocs.length ? (
              <ul className="divide-y divide-slate-100">
                {myDocs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-800">{d.label}</p>
                      <p className="text-xs text-slate-400">{d.originalName} · {formatBytes(d.size)} · {formatDate(d.createdAt, locale)}</p>
                      {d.status === "REJECTED" && d.reviewNote && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" />{d.reviewNote}</p>}
                    </div>
                    <Badge tone={docTone[d.status]}>{t.docStatus[d.status]}</Badge>
                    <a href={`/api/documents/${d.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.common.download}><Download className="h-4 w-4" /></a>
                  </li>
                ))}
              </ul>
            ) : <p className="p-5 text-sm text-slate-500">{t.account.noDocuments}</p>}
          </Card>

          {shared.length > 0 && (
            <Card>
              <CardHeader title={t.account.sharedWithYou} />
              <ul className="divide-y divide-slate-100">
                {shared.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="h-5 w-5 text-gold-600" />
                    <span className="flex-1 text-sm font-medium">{d.label}</span>
                    <a href={`/api/documents/${d.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700"><Download className="h-4 w-4" />{t.common.download}</a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {app.status.kind === "COMPLETED" && !app.testimonial && (
            <Card>
              <CardHeader title={t.account.reviewTitle} />
              <div className="p-5">
                <ActionForm action={submitReviewAction.bind(null, locale, app.id)} submitLabel={t.common.send} resetOnSuccess>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t.account.reviewRating}>
                      <Select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</Select>
                    </Field>
                    <Field label={t.account.reviewName}><Input name="displayName" defaultValue={`${user.firstName} ${user.lastName.charAt(0)}.`} maxLength={60} /></Field>
                  </div>
                  <Field label={t.account.reviewContent}><Textarea name="content" required minLength={10} maxLength={1500} /></Field>
                  <Checkbox name="consent" label={t.account.reviewConsent} />
                </ActionForm>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5 text-sm">
            <dl className="space-y-3">
              <div><dt className="text-slate-500">{t.account.package}</dt><dd className="font-medium">{app.package ? tr(app.package.name, locale) : "—"}</dd></div>
              <div><dt className="text-slate-500">{t.apply.totalDue}</dt><dd className="font-medium">{formatMAD(toNumber(app.totalAmount), locale)}</dd></div>
              {app.invoices.map((inv) => (
                <div key={inv.id}><dt className="text-slate-500">{t.account.invoice}</dt><dd><Link className="font-medium text-navy-700 underline" href={`/${locale}/account/invoices/${inv.id}`}>{inv.number}</Link> <Badge tone={inv.status === "PAID" ? "green" : "amber"}>{t.invoiceStatus[inv.status]}</Badge></dd></div>
              ))}
              {app.deadline && <div><dt className="text-slate-500">{t.account.deadline}</dt><dd className="font-medium">{formatDate(app.deadline, locale)}</dd></div>}
              <div><dt className="text-slate-500">{t.track.submittedOn}</dt><dd className="font-medium">{formatDate(app.submittedAt, locale)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t.account.timeline} />
            <div className="p-5"><StatusTimeline entries={app.history} locale={locale} /></div>
          </Card>
          <Card>
            <CardHeader title={t.account.contactAdvisor} />
            <div className="space-y-4 p-5">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" />{t.common.chatOnWhatsApp}</a>}
              <ActionForm action={createTicketAction.bind(null, locale)} submitLabel={t.common.send} submitSize="sm">
                <input type="hidden" name="applicationId" value={app.id} />
                <input type="hidden" name="subject" value={`${app.reference} — ${tr(app.country.name, locale)}`} />
                <Textarea name="body" required placeholder={t.common.message} rows={3} maxLength={5000} />
              </ActionForm>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
