import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, Download, Eye, FileArchive, FileText, Trash2 } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { renderWhatsAppText } from "@/lib/notify";
import { formatBytes, toNumber, whatsappLink, appUrl } from "@/lib/utils";
import {
  addNoteAction, archiveApplicationAction, cancelDocRequestAction, changeStatusAction, deleteDocumentAction, generateInvoiceAction,
  requestDocsAction, reviewDocumentAction, shareDocumentAction, updateApplicationMetaAction,
} from "@/actions/admin/applications";
import { recordPaymentAction } from "@/actions/admin/finance";
import { Badge, Card, CardHeader, Flag, StatusBadge } from "@/components/ui/misc";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { StatusTimeline } from "@/components/account/timeline";
import { customerApplicationPath } from "@/lib/features";

type ChecklistSnap = { id: string; title: unknown; required: boolean }[];

export default async function AdminApplication({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const ta = t.admin.applications;
  const me = await requireStaff(locale, "applications.view");
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true, country: true, visaType: true, package: true, status: true, discountCode: true,
      documents: { orderBy: { createdAt: "desc" } },
      documentRequests: { orderBy: { createdAt: "desc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      history: { include: { toStatus: true, changedBy: true }, orderBy: { createdAt: "desc" } },
      invoices: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      tickets: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!app) notFound();
  const [statuses, staff, packages, questions] = await Promise.all([
    prisma.applicationStatus.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ where: { role: { in: ["STAFF", "ADMIN", "OWNER"] }, isActive: true }, orderBy: { firstName: "asc" } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.question.findMany({ where: { OR: [{ countryId: null }, { countryId: app.countryId }] } }),
  ]);
  const manage = can(me.role, "applications.manage");
  const finance = can(me.role, "finance.manage");
  const checklist = (app.checklist as unknown as ChecklistSnap) || [];
  const answers = (app.answers as Record<string, string>) || {};
  const openRequests = app.documentRequests.filter((r) => r.status === "OPEN");
  const customerLocale = asLocale(app.locale);
  const link = appUrl(customerApplicationPath(customerLocale, app));
  const waStatus = whatsappLink(app.phone, `${await renderWhatsAppText("application_status_changed", customerLocale, { firstName: app.firstName, reference: app.reference, status: tr(app.status.label, customerLocale), note: "", link })}`);
  const waDocs = openRequests.length
    ? whatsappLink(app.phone, await renderWhatsAppText("documents_reminder", customerLocale, { firstName: app.firstName, reference: app.reference, documents: openRequests.map((r) => `• ${r.title}`).join("\n"), link }))
    : "";
  const docTone = { PENDING_REVIEW: "amber", ACCEPTED: "green", REJECTED: "red" } as const;
  const qLabel = (k: string) => {
    const q = questions.find((x) => x.key === k);
    return q ? tr(q.label, locale) : k;
  };
  const qValue = (k: string, v: string) => {
    const q = questions.find((x) => x.key === k);
    if (q?.type === "YES_NO") return v === "yes" ? t.common.yes : v === "no" ? t.common.no : v;
    const opt = Array.isArray(q?.options) ? (q!.options as { value: string; label: unknown }[]).find((o) => o.value === v) : null;
    return opt ? tr(opt.label, locale) : v;
  };
  const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Flag code={app.country.isoCode} className="h-10 w-14" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-navy-800">{app.firstName} {app.lastName} — {tr(app.country.name, locale)}{app.visaType ? ` · ${tr(app.visaType.name, locale)}` : ""}</h1>
            <p className="font-mono text-sm text-slate-500">{app.reference} · {ta.submitted} {formatDate(app.submittedAt, locale, true)}{app.isDraft ? ` · ${t.account.draft}` : ""}</p>
          </div>
          <StatusBadge label={tr(app.status.label, locale)} color={app.status.color} />
          {app.archivedAt && <Badge>{ta.archived}</Badge>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {waStatus && <a href={waStatus} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" />{ta.whatsappCustomer}</a>}
          {waDocs && <a href={waDocs} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#25D366] px-3 text-sm font-semibold text-[#128C7E]"><WhatsAppIcon className="h-4 w-4" />{ta.whatsappReminder}</a>}
          <a href={`/api/applications/${app.id}/zip`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"><FileArchive className="h-4 w-4" />{ta.downloadAll}</a>
          <Link href={`/${locale}/admin/customers/${app.userId}`} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">{t.admin.customers.profile}</Link>
          {manage && (
            <ConfirmForm action={archiveApplicationAction.bind(null, locale, app.id, !app.archivedAt)} confirm={app.archivedAt ? ta.unarchive : ta.archive}>
              <Button size="sm" variant="ghost" className="h-9">{app.archivedAt ? <><ArchiveRestore className="h-4 w-4" />{ta.unarchive}</> : <><Archive className="h-4 w-4" />{ta.archive}</>}</Button>
            </ConfirmForm>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {manage && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title={ta.changeStatus} />
                <div className="p-5">
                  <ActionForm action={changeStatusAction.bind(null, locale, app.id)} submitLabel={ta.update} resetOnSuccess>
                    <Select key={app.statusId} name="statusId" defaultValue={app.statusId}>
                      {statuses.map((s) => <option key={s.id} value={s.id}>{tr(s.label, locale)}{s.notifyCustomer ? " ✉" : ""}</option>)}
                    </Select>
                    <Textarea name="note" rows={3} placeholder={ta.statusNote} maxLength={2000} />
                  </ActionForm>
                </div>
              </Card>
              <Card>
                <CardHeader title={ta.requestDocs} />
                <div className="p-5">
                  <ActionForm action={requestDocsAction.bind(null, locale, app.id)} submitLabel={ta.sendRequest} resetOnSuccess>
                    <Textarea name="items" rows={3} required placeholder={ta.requestDocsHelp} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label={ta.dueDate}><Input type="date" name="dueDate" /></Field>
                      <Field label={t.common.message}><Input name="message" maxLength={500} /></Field>
                    </div>
                  </ActionForm>
                </div>
              </Card>
            </div>
          )}

          {openRequests.length > 0 && (
            <Card>
              <CardHeader title={`${ta.openRequests} (${openRequests.length})`} />
              <ul className="divide-y divide-slate-100">
                {openRequests.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className="flex-1"><strong>{r.title}</strong>{r.description ? ` — ${r.description}` : ""}<span className="block text-xs text-slate-400">{formatDate(r.createdAt, locale)}{r.dueDate ? ` → ${formatDate(r.dueDate, locale)}` : ""}{r.lastRemindedAt ? ` · ↻ ${formatDate(r.lastRemindedAt, locale)}` : ""}</span></span>
                    {manage && <form action={cancelDocRequestAction.bind(null, locale, app.id, r.id)}><Button size="sm" variant="ghost">{t.common.cancel}</Button></form>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title={`${ta.documents} (${app.documents.length})`} />
            <ul className="divide-y divide-slate-100">
              {app.documents.map((d) => (
                <li key={d.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <FileText className={d.direction === "SHARED_BY_STAFF" ? "h-5 w-5 text-gold-600" : "h-5 w-5 text-slate-400"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-slate-400">{d.originalName} · {formatBytes(d.size)} · {formatDate(d.createdAt, locale, true)}{d.direction === "SHARED_BY_STAFF" ? " · ↗" : ""}</p>
                      {d.reviewNote && <p className="text-xs text-red-600">{d.reviewNote}</p>}
                    </div>
                    <Badge tone={docTone[d.status]}>{t.docStatus[d.status]}</Badge>
                    <a href={`/api/documents/${d.id}?inline=1`} target="_blank" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.common.view}><Eye className="h-4 w-4" /></a>
                    <a href={`/api/documents/${d.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.common.download}><Download className="h-4 w-4" /></a>
                    {manage && (
                      <ConfirmForm action={deleteDocumentAction.bind(null, locale, app.id, d.id)} confirm={t.admin.content.deleteConfirm}>
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={t.common.delete}><Trash2 className="h-4 w-4" /></button>
                      </ConfirmForm>
                    )}
                  </div>
                  {manage && d.direction === "CUSTOMER_UPLOAD" && d.status === "PENDING_REVIEW" && (
                    <div className="mt-2 flex flex-wrap gap-2 ps-8">
                      <ActionForm action={reviewDocumentAction.bind(null, locale, app.id, d.id, "ACCEPTED")} inline submitLabel={ta.accept} submitSize="sm" submitVariant="outline"><span /></ActionForm>
                      <ActionForm action={reviewDocumentAction.bind(null, locale, app.id, d.id, "REJECTED")} inline submitLabel={ta.reject} submitSize="sm" submitVariant="danger">
                        <Input name="note" placeholder={ta.rejectReason} className="h-8 w-64" required />
                      </ActionForm>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {manage && (
              <div className="border-t border-slate-100 p-5">
                <p className="mb-2 text-sm font-semibold text-navy-800">{ta.shareDocument}</p>
                <ActionForm action={shareDocumentAction.bind(null, locale, app.id)} inline submitLabel={t.common.upload} submitSize="sm" resetOnSuccess>
                  <Input name="label" placeholder={t.account.documentLabel} className="h-9 w-56" />
                  <input type="file" name="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" />
                </ActionForm>
              </div>
            )}
          </Card>

          {checklist.length > 0 && (
            <Card>
              <CardHeader title={ta.checklist} />
              <ul className="grid grid-cols-1 gap-x-6 p-5 text-sm sm:grid-cols-2">
                {checklist.map((c) => {
                  const docs = app.documents.filter((d) => d.checklistItemId === c.id);
                  const st = docs.some((d) => d.status === "ACCEPTED") ? "✅" : docs.some((d) => d.status === "PENDING_REVIEW") ? "🟡" : "⬜";
                  return <li key={c.id} className="py-1">{st} {tr(c.title, locale)}{!c.required && <span className="text-xs text-slate-400"> ({t.common.optional})</span>}</li>;
                })}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={ta.applicant} />
              <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
                {[
                  [t.common.email, app.email], [t.common.phone, app.phone], [t.apply.dateOfBirth, formatDate(app.dateOfBirth, locale)], [t.apply.nationality, app.nationality],
                  [t.apply.passportNumber, app.passportNumber], [t.apply.passportExpiry, formatDate(app.passportExpiry, locale)], [t.apply.city, app.city], [t.common.language, app.locale.toUpperCase()],
                ].map(([k, v]) => <div key={String(k)}><dt className="text-xs text-slate-500">{k}</dt><dd className="break-words font-medium">{v || "—"}</dd></div>)}
              </dl>
            </Card>
            <Card>
              <CardHeader title={ta.travel} />
              <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
                {[[t.apply.departureDate, formatDate(app.departureDate, locale)], [t.apply.returnDate, formatDate(app.returnDate, locale)], [t.apply.travelers, app.travelers], [t.apply.purpose, app.purpose]].map(([k, v]) => (
                  <div key={String(k)}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
                ))}
                {app.additionalInfo && <div className="col-span-2"><dt className="text-xs text-slate-500">{t.apply.additionalInfo}</dt><dd className="whitespace-pre-line">{app.additionalInfo}</dd></div>}
              </dl>
              {Object.keys(answers).length > 0 && (
                <div className="border-t border-slate-100 p-5">
                  <p className="mb-2 text-sm font-semibold">{ta.answers}</p>
                  <dl className="space-y-1.5 text-sm">{Object.entries(answers).map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{qLabel(k)}</dt><dd className="font-medium">{qValue(k, v)}</dd></div>)}</dl>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {manage && (
            <Card>
              <CardHeader title={t.common.details} />
              <div className="p-5">
                <ActionForm action={updateApplicationMetaAction.bind(null, locale, app.id)} submitLabel={t.common.save} submitSize="sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={ta.deadline}><Input type="date" name="deadline" defaultValue={iso(app.deadline)} /></Field>
                    <Field label={ta.priority}><Select name="priority" defaultValue={String(app.priority)}><option value="0">{t.common.no}</option><option value="1">{t.common.yes}</option></Select></Field>
                  </div>
                  <Field label={ta.assignee}><Select name="assigneeId" defaultValue={app.assigneeId || ""}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</Select></Field>
                  <Field label={ta.package}><Select name="packageId" defaultValue={app.packageId || ""}><option value="">{ta.noPackage}</option>{packages.map((p) => <option key={p.id} value={p.id}>{tr(p.name, locale)} — {formatMAD(toNumber(p.price), locale)}</option>)}</Select></Field>
                </ActionForm>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title={ta.financial} />
            <div className="space-y-4 p-5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t.apply.subtotal}</span><span>{formatMAD(toNumber(app.subtotal), locale)}</span></div>
              {toNumber(app.discountAmount) > 0 && <div className="flex justify-between text-emerald-700"><span>{t.apply.discount} {app.discountCode?.code}</span><span>−{formatMAD(toNumber(app.discountAmount), locale)}</span></div>}
              <div className="flex justify-between font-bold"><span>{t.common.total}</span><span>{formatMAD(toNumber(app.totalAmount), locale)}</span></div>
              {app.invoices.map((inv) => (
                <div key={inv.id} className="rounded-lg bg-slate-50 p-3">
                  <Link href={`/${locale}/admin/invoices/${inv.id}`} className="font-mono font-semibold text-navy-700 underline">{inv.number}</Link> <Badge tone={inv.status === "PAID" ? "green" : inv.status === "CANCELLED" ? "slate" : "amber"}>{t.invoiceStatus[inv.status]}</Badge>
                  <p className="text-xs text-slate-500">{t.account.paid}: {formatMAD(toNumber(inv.amountPaid), locale)} / {formatMAD(toNumber(inv.total), locale)}</p>
                  {inv.payments.map((p) => <p key={p.id} className="text-xs text-slate-500">• {p.reference} {formatMAD(toNumber(p.amount), locale)} — {t.paymentStatus[p.status]}</p>)}
                </div>
              ))}
              {finance && !app.invoices.some((i) => i.status !== "CANCELLED") && app.packageId && (
                <form action={generateInvoiceAction.bind(null, locale, app.id)}><Button size="sm" variant="outline">{ta.createInvoice}</Button></form>
              )}
              {finance && app.invoices.some((i) => ["ISSUED", "PARTIALLY_PAID"].includes(i.status)) && (
                <details className="rounded-lg border border-slate-200 p-3">
                  <summary className="cursor-pointer font-semibold">{ta.recordPayment}</summary>
                  <div className="mt-3">
                    <ActionForm action={recordPaymentAction.bind(null, locale)} submitLabel={t.common.save} submitSize="sm">
                      <Select name="invoiceId">{app.invoices.filter((i) => ["ISSUED", "PARTIALLY_PAID"].includes(i.status)).map((i) => <option key={i.id} value={i.id}>{i.number}</option>)}</Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Input name="amount" type="number" step="0.01" min="0.01" required placeholder={t.common.amount} />
                        <Select name="method">{(["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const).map((m) => <option key={m} value={m}>{t.paymentMethod[m]}</option>)}</Select>
                      </div>
                      <Input name="note" placeholder={t.admin.payments.verifyNote} />
                      <p className="text-xs text-amber-700">{t.admin.payments.manualWarning}</p>
                    </ActionForm>
                  </div>
                </details>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={ta.internalNotes} />
            <div className="space-y-3 p-5">
              {manage && (
                <ActionForm action={addNoteAction.bind(null, locale, app.id)} submitLabel={ta.addNote} submitSize="sm" resetOnSuccess>
                  <Textarea name="body" rows={2} required placeholder={ta.notePlaceholder} />
                </ActionForm>
              )}
              {app.notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-amber-50/60 p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.author ? `${n.author.firstName} · ` : ""}{formatDate(n.createdAt, locale, true)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={ta.history} />
            <div className="p-5"><StatusTimeline entries={app.history} locale={locale} /></div>
          </Card>

          {app.tickets.length > 0 && (
            <Card>
              <CardHeader title={t.admin.nav.support} />
              <ul className="divide-y divide-slate-100 text-sm">
                {app.tickets.map((tk) => <li key={tk.id}><Link href={`/${locale}/admin/support/${tk.id}`} className="flex justify-between px-5 py-3 hover:bg-slate-50"><span>{tk.subject}</span><Badge>{t.ticketStatus[tk.status]}</Badge></Link></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
