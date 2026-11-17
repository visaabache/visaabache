import { cookies } from "next/headers";
import { CheckCircle2, MonitorSmartphone, ShieldAlert, ShieldCheck } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { hashToken, requireStaff, SESSION_COOKIE } from "@/lib/auth/session";
import { newTotpSecret, openSecret, otpauthUri, qrSvg, sealSecret } from "@/lib/auth/totp";
import { prisma } from "@/lib/db";
import { disableTotpAction, enableTotpAction, signOutOtherSessionsAction } from "@/actions/security";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

function device(ua: string | null) {
  const u = ua || "";
  const os = /iPhone|iPad/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X/.test(u) ? "macOS" : /Linux/.test(u) ? "Linux" : "—";
  const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" · ");
}

/** Staff account security: two-step verification (authenticator app), signed-in devices, recent sign-ins. */
export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const s = t.security;
  const me = await requireStaff(locale);
  let user = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { id: true, email: true, totpSecret: true, totpEnabledAt: true } });

  // Pending secret for the setup QR code (kept until confirmed, so reloading the page shows the same code).
  if (!user.totpEnabledAt && !user.totpSecret) {
    user = await prisma.user.update({ where: { id: user.id }, data: { totpSecret: sealSecret(newTotpSecret()), totpLastStep: null }, select: { id: true, email: true, totpSecret: true, totpEnabledAt: true } });
  }
  const secret = !user.totpEnabledAt && user.totpSecret ? openSecret(user.totpSecret) : null;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const current = token ? hashToken(token) : "";
  const [sessions, logins] = await Promise.all([
    prisma.session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" }, take: 20 }),
    prisma.auditLog.findMany({ where: { actorId: user.id, action: { in: ["auth.login", "auth.login_failed", "auth.login_failed_2fa"] } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader title={s.title} description={s.subtitle} />

      <Card>
        <CardHeader
          title={<span className="flex items-center gap-2">{user.totpEnabledAt ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-amber-600" />}{user.totpEnabledAt ? s.statusOn : s.statusOff}</span>}
          description={user.totpEnabledAt ? formatDate(user.totpEnabledAt, locale, true) : undefined}
        />
        <div className="p-5">
          {secret ? (
            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="mx-auto w-[220px] self-start rounded-xl border border-slate-200 bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg(otpauthUri(user.email, secret)) }} />
              <div className="space-y-4">
                <ol className="list-decimal space-y-2 ps-5 text-sm text-slate-700">
                  <li>{s.step1}</li>
                  <li>{s.step2}</li>
                  <li>{s.step3}</li>
                </ol>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{s.manualKey}</p>
                  <code dir="ltr" className="block select-all break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm tracking-wider text-navy-800">{secret.match(/.{1,4}/g)?.join(" ")}</code>
                </div>
                <ActionForm action={enableTotpAction.bind(null, locale)} submitLabel={s.enable}>
                  <Field label={s.code} htmlFor="code" required>
                    <Input id="code" name="code" required inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} autoComplete="one-time-code" dir="ltr" className="max-w-[200px] font-mono tracking-[0.3em]" />
                  </Field>
                </ActionForm>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert tone="success">{s.enabled}</Alert>
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-navy-800">{s.disableTitle}</summary>
                <p className="mt-2 text-sm text-slate-500">{s.disableHint}</p>
                <ActionForm action={disableTotpAction.bind(null, locale)} submitLabel={s.disable} submitVariant="danger" className="mt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={s.password} htmlFor="password" required><Input id="password" name="password" type="password" required autoComplete="current-password" /></Field>
                    <Field label={s.code} htmlFor="dcode" required><Input id="dcode" name="code" required inputMode="numeric" maxLength={7} autoComplete="one-time-code" dir="ltr" className="font-mono tracking-[0.3em]" /></Field>
                  </div>
                </ActionForm>
              </details>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">{s.lostPhone}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title={s.sessionsTitle} description={s.sessionsHint} />
        <ul className="divide-y divide-slate-100">
          {sessions.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <MonitorSmartphone className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-navy-800">{device(x.userAgent)}</span>
              <span dir="ltr" className="font-mono text-xs text-slate-500">{x.ip}</span>
              <span className="text-xs text-slate-500">{s.lastSeen}: {formatDate(x.lastSeenAt, locale, true)}</span>
              {x.tokenHash === current && <Badge tone="green">{s.thisDevice}</Badge>}
            </li>
          ))}
        </ul>
        {sessions.length > 1 && (
          <div className="border-t border-slate-100 p-5">
            <ActionForm action={signOutOtherSessionsAction.bind(null, locale)} submitLabel={s.signOutOthers} submitVariant="outline">{null}</ActionForm>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={s.activityTitle} />
        {logins.length ? (
          <ul className="divide-y divide-slate-100">
            {logins.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                {l.action === "auth.login" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-red-500" />}
                <span className={l.action === "auth.login" ? "text-slate-700" : "font-medium text-red-600"}>{l.action === "auth.login" ? s.success : s.failed}</span>
                <span dir="ltr" className="font-mono text-xs text-slate-500">{l.ip}</span>
                <span className="text-xs text-slate-500">{formatDate(l.createdAt, locale, true)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500">{s.none}</p>
        )}
      </Card>
    </div>
  );
}
