import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { runAutomationsAction } from "@/actions/admin/system";
import { Alert, Badge, Card, CardHeader, Table } from "@/components/ui/misc";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Automation({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const ta = t.admin.automation;
  await requireStaff(locale, "automation.run");
  const [runs, logs] = await Promise.all([
    prisma.automationRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader title={ta.title} />
      <Alert tone="info">{ta.text}<br /><code className="text-xs">GET /api/cron/run — Authorization: Bearer $CRON_SECRET</code></Alert>
      <Card className="p-5"><ActionForm action={runAutomationsAction.bind(null, locale)} submitLabel={ta.runNow}><span /></ActionForm></Card>
      <Card>
        <CardHeader title={ta.lastRuns} />
        <Table>
          <thead><tr><th>{ta.started}</th><th>{ta.trigger}</th><th>{ta.result}</th></tr></thead>
          <tbody>{runs.map((r) => (
            <tr key={r.id}>
              <td className="text-xs">{formatDate(r.startedAt, locale, true)}</td><td><Badge>{r.trigger}</Badge></td>
              <td className="text-xs">{r.error ? <span className="text-red-600">{r.error}</span> : Object.entries((r.summary as Record<string, number>) || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}</td>
            </tr>
          ))}</tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title={ta.notificationLog} />
        <Table>
          <thead><tr><th>{t.common.date}</th><th>{ta.channel}</th><th>{ta.recipient}</th><th>{t.admin.templates.key}</th><th>{t.common.status}</th></tr></thead>
          <tbody>{logs.map((l) => (
            <tr key={l.id}><td className="text-xs">{formatDate(l.createdAt, locale, true)}</td><td><Badge>{l.channel}</Badge></td><td className="text-xs">{l.recipient}</td><td className="font-mono text-xs">{l.templateKey}<p className="text-slate-400">{l.subject}</p></td><td><Badge tone={l.status === "SENT" ? "green" : "red"}>{l.status}</Badge>{l.error && <p className="text-xs text-red-600">{l.error}</p>}</td></tr>
          ))}</tbody>
        </Table>
      </Card>
    </div>
  );
}
