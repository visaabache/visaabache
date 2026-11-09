import { CheckCircle2, Circle, CreditCard, FileText, History, Search, Wallet } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatMAD, tr } from "@/lib/i18n/localized";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { toNumber, whatsappLink } from "@/lib/utils";
import { PageHero } from "@/components/site/cards";
import { Alert, Card, Flag, StatusBadge } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { WhatsAppIcon } from "@/components/ui/icons";
import { StatusTimeline } from "@/components/account/timeline";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/track", title: t.track.title, description: t.track.subtitleCode });
}

type ChecklistSnap = { id: string; title: unknown; description: unknown; required: boolean }[];

/**
 * Public tracking page: the customer enters the tracking code received after applying (the application reference,
 * random and unguessable, lookups rate-limited) and sees the status, history, documents to send and payment info.
 * Deliberately shows no personal data beyond the first name.
 */
export default async function TrackPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string; ref?: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const sp = await searchParams;
  const code = String(sp.code || sp.ref || "").trim().toUpperCase().slice(0, 32);

  let error: string | null = null;
  let app: Awaited<ReturnType<typeof load>> = null;
  if (code) {
    const { ip } = await getRequestMeta();
    if (!(await rateLimit(`track:${ip}`, 30, 900))) error = t.common.tooManyRequests;
    else {
      app = await load(code);
      if (!app) error = t.track.notFoundCode;
    }
  }
  const settings = app ? await getSettings() : null;

  return (
    <>
      <PageHero title={t.track.title} subtitle={t.track.subtitleCode} />
      <section className="container max-w-3xl py-10 sm:py-14">
        <Card className="p-5 sm:p-6">
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{t.track.codeLabel}</span>
              <Input name="code" required defaultValue={code} placeholder={t.track.referencePlaceholder} dir="ltr" autoComplete="off" autoCapitalize="characters" className="h-12 font-mono uppercase tracking-wider" />
            </label>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-navy-800 px-6 font-semibold text-white hover:bg-navy-700">
              <Search className="h-4 w-4" /> {t.track.button}
            </button>
          </form>
          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
        </Card>

        {app && settings && <TrackResult app={app} locale={locale} t={t} settings={settings} />}
      </section>
    </>
  );
}

async function load(reference: string) {
  return prisma.application.findFirst({
    where: { reference, isDraft: false },
    select: {
      reference: true, firstName: true, submittedAt: true, checklist: true,
      status: { select: { label: true, description: true, color: true } },
      country: { select: { name: true, isoCode: true } },
      visaType: { select: { name: true } },
      history: { orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, note: true, toStatus: { select: { label: true, color: true } } } },
      documentRequests: { where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, select: { id: true, title: true, description: true, dueDate: true } },
      invoices: { where: { status: { not: "CANCELLED" } }, select: { number: true, total: true, amountPaid: true } },
    },
  });
}

function TrackResult({ app, locale, t, settings }: {
  app: NonNullable<Awaited<ReturnType<typeof load>>>;
  locale: ReturnType<typeof asLocale>;
  t: ReturnType<typeof getDictionary>;
  settings: Awaited<ReturnType<typeof getSettings>>;
}) {
  const checklist = ((app.checklist as unknown as ChecklistSnap) || []).filter(Boolean);
  const total = app.invoices.reduce((s, i) => s + toNumber(i.total), 0);
  const paid = app.invoices.reduce((s, i) => s + toNumber(i.amountPaid), 0);
  const balance = Math.max(0, total - paid);
  const wa = settings.whatsapp.enabled ? (text: string) => whatsappLink(settings.whatsapp.number, text) : null;
  const docsMsg = t.apply.whatsappDocsMessage.replace("{reference}", app.reference);
  const p = settings.payments;

  return (
    <div className="mt-6 space-y-6" aria-live="polite">
      {/* Summary + status */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-navy-900 p-5 text-white sm:p-6">
          <Flag code={app.country.isoCode} className="h-10 w-14 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm tracking-wider text-gold-300">{app.reference}</p>
            <p className="font-display text-2xl font-semibold">{tr(app.country.name, locale)}</p>
            <p className="text-sm text-navy-200">
              {app.visaType ? `${t.track.visaType}: ${tr(app.visaType.name, locale)} · ` : ""}
              {t.track.submittedOn}: {formatDate(app.submittedAt, locale)}
            </p>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.track.currentStatus}</p>
          <div className="mt-2"><StatusBadge label={tr(app.status.label, locale)} color={app.status.color} /></div>
          {tr(app.status.description, locale) && <p className="mt-3 text-slate-600">{tr(app.status.description, locale)}</p>}
        </div>
      </Card>

      {/* Documents */}
      {(app.documentRequests.length > 0 || checklist.length > 0) && (
        <Card className="p-5 sm:p-6">
          {app.documentRequests.length > 0 && (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-navy-800"><FileText className="h-5 w-5 text-gold-600" />{t.track.requested}</h2>
              <ul className="mt-3 space-y-2">
                {app.documentRequests.map((r) => (
                  <li key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="font-medium text-navy-800">{r.title}</p>
                    {r.description && <p className="text-slate-600">{r.description}</p>}
                    {r.dueDate && <p className="text-xs text-amber-700">{formatDate(r.dueDate, locale)}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {checklist.length > 0 && (
            <>
              <h2 className={`flex items-center gap-2 font-semibold text-navy-800 ${app.documentRequests.length ? "mt-6" : ""}`}><FileText className="h-5 w-5 text-gold-600" />{t.track.toPrepare}</h2>
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {checklist.map((i) => (
                  <li key={i.id} className="flex gap-3 p-3 text-sm">
                    {i.required ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                    <div>
                      <p className="font-medium text-navy-800">{tr(i.title, locale)} <span className="text-xs font-normal text-slate-400">· {i.required ? t.country.requiredDoc : t.country.conditionalDoc}</span></p>
                      {tr(i.description, locale) && <p className="text-slate-500">{tr(i.description, locale)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-sm text-slate-600">{t.track.sendDocs}</p>
          {wa && (
            <a href={wa(docsMsg)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-12 items-center gap-2 rounded-lg bg-[#25D366] px-5 font-semibold text-white hover:brightness-95">
              <WhatsAppIcon className="h-5 w-5" /> {t.apply.sendDocsWhatsapp}
            </a>
          )}
        </Card>
      )}

      {/* Payment */}
      {total > 0 && (
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-800"><Wallet className="h-5 w-5 text-gold-600" />{t.track.payment}</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{t.track.total}</dt><dd className="font-semibold text-navy-800">{formatMAD(total, locale)}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{t.track.paid}</dt><dd className="font-semibold text-emerald-700">{formatMAD(paid, locale)}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{t.track.balance}</dt><dd className="font-semibold text-navy-800">{formatMAD(balance, locale)}</dd></div>
          </dl>
          {balance <= 0.001 ? (
            <p className="mt-4 font-medium text-emerald-700">{t.track.paidInFull}</p>
          ) : (
            <div className="mt-5 space-y-3 text-sm">
              <p className="font-semibold text-navy-800">{t.track.payHow}</p>
              {p.bankTransferEnabled && (p.bankRib || p.bankName) && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 font-medium text-navy-800"><CreditCard className="h-4 w-4" />{t.track.bankTransfer}</p>
                  <dl className="mt-2 space-y-0.5 text-slate-600">
                    {p.bankBeneficiary && <div>{p.bankBeneficiary}</div>}
                    {p.bankName && <div>{p.bankName}</div>}
                    {p.bankRib && <div className="font-mono" dir="ltr">RIB : {p.bankRib}</div>}
                    {p.bankSwift && <div className="font-mono" dir="ltr">SWIFT : {p.bankSwift}</div>}
                  </dl>
                  <p className="mt-2 text-slate-500">{t.track.sendReceipt}</p>
                </div>
              )}
              {p.cashEnabled && <p className="rounded-xl border border-slate-200 p-4 font-medium text-navy-800">{t.track.cash}</p>}
            </div>
          )}
        </Card>
      )}

      {/* History */}
      {app.history.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-navy-800"><History className="h-5 w-5 text-gold-600" />{t.track.history}</h2>
          <StatusTimeline entries={app.history} locale={locale} />
        </Card>
      )}

      {wa && (
        <a href={wa(`${t.apply.whatsappApplyMessage.replace("{reference}", app.reference)}`)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:underline">
          <WhatsAppIcon className="h-4 w-4" /> {t.track.contactAdvisor}
        </a>
      )}
    </div>
  );
}
