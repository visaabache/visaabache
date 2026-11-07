import Link from "next/link";
import { Plus } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, Table } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Articles({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <AdminPageHeader title={t.admin.nav.articles} actions={<ButtonLink href={`/${locale}/admin/articles/new`} variant="navy"><Plus className="h-4 w-4" />{t.admin.content.new}</ButtonLink>} />
      <Card><Table>
        <thead><tr><th>{t.admin.content.title}</th><th>{t.admin.content.category}</th><th>{t.blog.published}</th><th>{t.common.status}</th></tr></thead>
        <tbody>{articles.map((a) => (
          <tr key={a.id}>
            <td><Link className="font-medium text-navy-700 hover:underline" href={`/${locale}/admin/articles/${a.id}`}>{tr(a.title, locale)}</Link></td>
            <td>{t.blog.categories[a.category]}</td><td>{formatDate(a.publishedAt, locale)}</td>
            <td>{a.isPublished ? <Badge tone="green">{t.admin.content.published}</Badge> : <Badge>draft</Badge>}</td>
          </tr>
        ))}</tbody>
      </Table></Card>
    </div>
  );
}
