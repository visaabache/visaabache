import Link from "@/components/ui/link";
import { Plus } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatMAD, tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { Badge, Card, Table } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Services({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const services = await prisma.service.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { inquiries: true } } } });
  return (
    <div>
      <AdminPageHeader title={t.admin.nav.services} actions={<ButtonLink href={`/${locale}/admin/services/new`} variant="navy"><Plus className="h-4 w-4" />{t.admin.content.new}</ButtonLink>} />
      <Card><Table>
        <thead><tr><th>{t.admin.content.name}</th><th>{t.admin.content.category}</th><th>{t.services.price}</th><th>{t.admin.nav.inquiries}</th><th>{t.common.status}</th></tr></thead>
        <tbody>{services.map((s) => (
          <tr key={s.id}>
            <td><Link className="font-medium text-navy-700 hover:underline" href={`/${locale}/admin/services/${s.id}`}>{tr(s.name, locale)}</Link></td>
            <td>{t.services.categories[s.category]}</td>
            <td>{s.priceType === "QUOTE" || s.price == null ? t.common.onQuote : `${s.priceType === "FROM" ? t.common.from + " " : ""}${formatMAD(toNumber(s.price), locale)}`}</td>
            <td>{s._count.inquiries}</td>
            <td>{s.isActive ? <Badge tone="green">{t.admin.content.active}</Badge> : <Badge>off</Badge>}{s.isFeatured && <Badge tone="gold" className="ms-1">★</Badge>}</td>
          </tr>
        ))}</tbody>
      </Table></Card>
    </div>
  );
}
