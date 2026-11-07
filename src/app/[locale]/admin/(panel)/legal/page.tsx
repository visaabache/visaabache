import Link from "next/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Alert, Card, Table } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function LegalList({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const pages = await prisma.legalPage.findMany({ orderBy: { slug: "asc" } });
  return (
    <div className="max-w-4xl">
      <AdminPageHeader title={t.admin.nav.legal} />
      <Alert tone="warning" className="mb-4">{t.footer.cndp}</Alert>
      <Card><Table><tbody>{pages.map((p) => <tr key={p.id}><td><Link className="font-medium text-navy-700 hover:underline" href={`/${locale}/admin/legal/${p.id}`}>{tr(p.title, locale)}</Link></td><td>v{p.version}</td><td>{formatDate(p.updatedAt, locale)}</td></tr>)}</tbody></Table></Card>
    </div>
  );
}
