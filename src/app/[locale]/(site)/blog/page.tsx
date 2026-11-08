import Link from "@/components/ui/link";
import type { ArticleCategory } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { fmt, formatDate, tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { readingMinutes } from "@/lib/markdown";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/cards";
import { Card, EmptyState, Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const CATS: ArticleCategory[] = ["VISA_INFO", "TRAVEL_ADVICE", "ADMIN_PROCEDURES", "OPPORTUNITIES"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/blog", title: t.blog.title, description: t.blog.subtitle });
}

export default async function BlogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string; page?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const category = CATS.includes(sp.category as ArticleCategory) ? (sp.category as ArticleCategory) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 9;
  const where = { isPublished: true, publishedAt: { lte: new Date() }, ...(category ? { category } : {}) };
  const [articles, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.article.count({ where }),
  ]);
  const pages = Math.ceil(total / perPage);
  const chip = (active: boolean) => cn("rounded-full px-4 py-1.5 text-sm font-medium transition", active ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200");
  return (
    <>
      <PageHero title={t.blog.title} subtitle={t.blog.subtitle} />
      <section className="container py-12">
        <nav className="flex flex-wrap gap-2">
          <Link href={`/${locale}/blog`} className={chip(!category)}>{t.blog.allCategories}</Link>
          {CATS.map((c) => (
            <Link key={c} href={`/${locale}/blog?category=${c}`} className={chip(category === c)}>{t.blog.categories[c]}</Link>
          ))}
        </nav>
        {articles.length === 0 ? (
          <div className="mt-10"><EmptyState title={t.blog.noArticles} /></div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/${locale}/blog/${a.slug}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-1 group-hover:shadow-premium">
                  {a.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="bg-hero flex aspect-[16/9] items-end p-5"><span className="font-display text-xl text-white/90">VISA ABACHE</span></div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <Badge tone="gold" className="self-start">{t.blog.categories[a.category]}</Badge>
                    <h2 className="mt-3 text-lg font-semibold text-navy-800 group-hover:text-navy-600">{tr(a.title, locale)}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{tr(a.excerpt, locale)}</p>
                    <p className="mt-4 text-xs text-slate-400">
                      {formatDate(a.publishedAt, locale)} · {fmt(t.blog.readingTime, { minutes: readingMinutes(tr(a.content, locale)) })}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {pages > 1 && (
          <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pages }).map((_, i) => (
              <Link key={i} href={`/${locale}/blog?page=${i + 1}${category ? `&category=${category}` : ""}`} className={chip(page === i + 1)}>{i + 1}</Link>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}
