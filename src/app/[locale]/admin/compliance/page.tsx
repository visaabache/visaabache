import Link from "next/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { resolveDataRequestAction } from "@/actions/admin/system";
import { Alert, Badge, Card, CardHeader, Table } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Compliance({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tc = t.admin.compliance;
  await requireStaff(locale, "compliance.manage");
  const [requests, consents, s] = await Promise.all([
    prisma.dataRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }),
    prisma.consentRecord.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    getSettings(),
  ]);
  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader title={tc.title} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Alert tone="info" title={t.admin.settings.retention}>
          {t.admin.settings.archiveAfter}: <b>{s.retention.archiveCompletedAfterDays}</b> · {t.admin.settings.deleteDocsAfter}: <b>{s.retention.deleteDocumentsAfterDays}</b> · {t.admin.settings.deleteDraftsAfter}: <b>{s.retention.deleteDraftsAfterDays}</b>
          <br /><Link href={`/${locale}/admin/settings#retention`} className="underline">{t.common.edit}</Link>
        </Alert>
        <Alert tone="warning" title={tc.backups}>{tc.backupsText}</Alert>
      </div>
      <Card>
        <CardHeader title={tc.requests} />
        <Table>
          <thead><tr><th>{t.common.date}</th><th>{t.common.email}</th><th>{t.common.status}</th><th>{t.common.details}</th><th>{t.common.actions}</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="text-xs">{formatDate(r.createdAt, locale, true)}</td>
                <td>{r.userId ? <Link className="underline" href={`/${locale}/admin/customers/${r.userId}`}>{r.email}</Link> : r.email}<br /><Badge>{tc.type[r.type]}</Badge></td>
                <td><Badge tone={r.status === "PENDING" ? "amber" : r.status === "COMPLETED" ? "green" : "slate"}>{tc.status[r.status]}</Badge></td>
                <td className="max-w-xs text-xs">{r.details}{r.response && <p className="text-slate-500">→ {r.response}</p>}</td>
                <td>{r.status === "PENDING" && (
                  <div className="space-y-2">
                    <ActionForm action={resolveDataRequestAction.bind(null, locale, r.id, "COMPLETED")} inline submitLabel={tc.complete} submitSize="sm"><Input name="response" placeholder={tc.response} className="h-8 w-48" /></ActionForm>
                    <ActionForm action={resolveDataRequestAction.bind(null, locale, r.id, "REJECTED")} inline submitLabel={tc.rejectReq} submitSize="sm" submitVariant="outline"><Input name="response" placeholder={tc.response} className="h-8 w-48" /></ActionForm>
                    {r.type === "DELETION" && r.userId && <Link href={`/${locale}/admin/customers/${r.userId}`} className="text-xs text-red-600 underline">{t.admin.customers.anonymize}</Link>}
                  </div>
                )}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title={tc.consents} />
        <Table>
          <tbody>{consents.map((c) => <tr key={c.id}><td className="text-xs">{formatDate(c.createdAt, locale, true)}</td><td>{c.email}</td><td><Badge tone={c.granted ? "green" : "red"}>{c.type}</Badge></td><td className="text-xs">v{c.version} · {c.context}</td><td className="font-mono text-xs text-slate-400">{c.ip}</td></tr>)}</tbody>
        </Table>
      </Card>
    </div>
  );
}
