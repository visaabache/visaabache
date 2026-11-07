import Link from "next/link";
import { notFound } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { fmt, formatDate, tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { readingMinutes, renderMarkdown } from "@/lib/markdown";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { appUrl } from "@/lib/utils";
import { Badge, Card, Prose } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { SocialIcon, WhatsAppIcon } from "@/components/ui/icons";

async function load(slug: string) {
  return prisma.article.findFirst({ where: { slug, isPublished: true, publishedAt: { lte: new Date() } } });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const a = await load(slug);
  if (!a) return {};
  return pageMetadata({ locale, path: `/blog/${slug}`, title: tr(a.seoTitle, locale) || tr(a.title, locale), description: tr(a.seoDescription, locale) || tr(a.excerpt, locale), image: a.coverImageUrl, type: "article" });
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  const a = await load(slug);
  if (!a) notFound();
  const related = await prisma.article.findMany({ where: { isPublished: true, category: a.category, id: { not: a.id }, publishedAt: { lte: new Date() } }, take: 3, orderBy: { publishedAt: "desc" } });
  const content = tr(a.content, locale);
  const url = appUrl(`/${locale}/blog/${a.slug}`);
  const title = tr(a.title, locale);
  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: tr(a.excerpt, locale),
          datePublished: a.publishedAt?.toISOString(),
          dateModified: a.updatedAt.toISOString(),
          author: { "@type": "Organization", name: a.authorName },
          publisher: { "@type": "Organization", name: "VISA ABACHE" },
          image: a.coverImageUrl || undefined,
          mainEntityOfPage: url,
          inLanguage: locale,
        }}
      />
      <header className="bg-hero text-white">
        <div className="container max-w-3xl py-14">
          <Link href={`/${locale}/blog?category=${a.category}`}><Badge tone="gold">{t.blog.categories[a.category]}</Badge></Link>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-navy-200">
            {a.authorName} · {t.blog.published} {formatDate(a.publishedAt, locale)} · {fmt(t.blog.readingTime, { minutes: readingMinutes(content) })}
          </p>
        </div>
      </header>
      <div className="container max-w-3xl py-12">
        {a.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.coverImageUrl} alt="" className="mb-10 w-full rounded-2xl object-cover shadow-soft" />
        )}
        <Prose html={renderMarkdown(content)} className="prose-lg" />
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 text-sm">
          <span className="font-medium text-slate-600">{t.blog.share}:</span>
          <a className="rounded-full bg-[#25D366] p-2 text-white" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><WhatsAppIcon className="h-4 w-4" /></a>
          <a className="rounded-full bg-[#1877F2] p-2 text-white" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><SocialIcon network="facebook" className="h-4 w-4" /></a>
          <a className="rounded-full bg-[#0A66C2] p-2 text-white" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><SocialIcon network="linkedin" className="h-4 w-4" /></a>
        </div>
        <Card className="mt-10 flex flex-col items-start gap-4 bg-navy-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-navy-800">{t.home.ctaTitle}</p>
          <ButtonLink href={`/${locale}/apply`}>{t.common.applyForAssistance}</ButtonLink>
        </Card>
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-navy-800">{t.blog.related}</h2>
            <ul className="mt-4 space-y-2">
              {related.map((r) => (
                <li key={r.id}><Link href={`/${locale}/blog/${r.slug}`} className="font-medium text-navy-700 hover:underline">{tr(r.title, locale)}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
