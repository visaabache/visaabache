import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/misc";
import { ApplicationRow } from "@/components/account/application-row";

export default async function MyApplications({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const apps = await prisma.application.findMany({ where: { userId: user.id }, include: { country: true, status: true, documentRequests: { where: { status: "OPEN" } } }, orderBy: { updatedAt: "desc" } });
  return (
    <Card>
      <CardHeader title={t.account.applications} action={<ButtonLink href={`/${locale}/apply`} size="sm">{t.account.newApplication}</ButtonLink>} />
      {apps.length ? <ul className="divide-y divide-slate-100">{apps.map((a) => <ApplicationRow key={a.id} a={a} locale={locale} t={t} />)}</ul> : <div className="p-5"><EmptyState title={t.account.noApplications} /></div>}
    </Card>
  );
}
