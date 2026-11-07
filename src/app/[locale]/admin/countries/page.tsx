import Link from "next/link";
import { Plus } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, Flag, Table } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Countries({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const countries = await prisma.country.findMany({ orderBy: [{ region: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { visaTypes: true, checklistItems: true, links: true, applications: true } } } });
  return (
    <div>
      <AdminPageHeader title={t.admin.nav.countries} description={t.country.notVerified} actions={<>
        <ButtonLink href={`/${locale}/admin/countries/questions`} variant="outline">{t.admin.content.questions}</ButtonLink>
        <ButtonLink href={`/${locale}/admin/countries/new`} variant="navy"><Plus className="h-4 w-4" />{t.admin.content.new}</ButtonLink>
      </>} />
      <Card>
        <Table>
          <thead><tr><th>{t.admin.content.name}</th><th>{t.admin.content.region}</th><th>{t.admin.content.visaTypes}</th><th>{t.admin.content.checklist}</th><th>{t.admin.content.links}</th><th>{t.admin.applications.title}</th><th>{t.admin.content.lastVerified}</th></tr></thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/${locale}/admin/countries/${c.id}`} className="flex items-center gap-2 font-medium text-navy-700 hover:underline"><Flag code={c.isoCode} className="h-4 w-6" />{tr(c.name, locale)}</Link>{!c.isActive && <Badge className="ms-2">off</Badge>}{c.isPopular && <Badge tone="gold" className="ms-1">★</Badge>}</td>
                <td>{t.regions[c.region]}</td>
                <td>{c._count.visaTypes}</td><td>{c._count.checklistItems}</td><td>{c._count.links}</td><td>{c._count.applications}</td>
                <td>{c.lastVerifiedAt ? <Badge tone="green">{formatDate(c.lastVerifiedAt, locale)}</Badge> : <Badge tone="amber">—</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
