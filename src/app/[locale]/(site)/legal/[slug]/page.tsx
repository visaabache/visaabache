import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate, tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/cards";
import { Card, Prose } from "@/components/ui/misc";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const p = await prisma.legalPage.findUnique({ where: { slug } });
  return p ? pageMetadata({ locale, path: `/legal/${slug}`, title: tr(p.title, locale) }) : {};
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const p = await prisma.legalPage.findUnique({ where: { slug } });
  if (!p) notFound();
  const b = (await getSettings()).business;
  const identity = [b.legalName || b.name, b.address, b.city, b.ice && `ICE ${b.ice}`, b.rc && `RC ${b.rc}`, b.ifNumber && `IF ${b.ifNumber}`, b.patente && `Patente ${b.patente}`, b.cndpDeclaration && `CNDP ${b.cndpDeclaration}`, b.email].filter(Boolean);
  return (
    <>
      <PageHero title={tr(p.title, locale)} subtitle={`${t.common.lastUpdated}: ${formatDate(p.updatedAt, locale)} · v${p.version}`} />
      <section className="container grid grid-cols-1 gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Prose html={renderMarkdown(tr(p.content, locale))} className="prose-table:text-sm" />
        <aside>
          <Card className="space-y-1 p-5 text-sm text-slate-600">
            {identity.map((x) => (
              <p key={String(x)}>{x}</p>
            ))}
            {b.dpoEmail && <p className="pt-2 font-medium text-navy-800">{b.dpoEmail}</p>}
          </Card>
        </aside>
      </section>
    </>
  );
}
