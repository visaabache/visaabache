import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { prisma } from "@/lib/db";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { FaqList, PageHero } from "@/components/site/cards";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/faq", title: t.faq.title, description: t.faq.subtitle });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const faqs = await prisma.faq.findMany({ where: { scope: "GENERAL", isPublished: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: tr(f.question, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.answer, locale) } })) }} />
      <PageHero title={t.faq.title} subtitle={t.faq.subtitle} />
      <section className="container max-w-3xl py-14">
        <FaqList items={faqs} locale={locale} />
      </section>
    </>
  );
}
