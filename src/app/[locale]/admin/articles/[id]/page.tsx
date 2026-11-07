import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteArticleAction } from "@/actions/admin/content";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/content-forms";

export default async function EditArticle({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  const locale = asLocale(l);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  const a = id === "new" ? null : await prisma.article.findUnique({ where: { id } });
  if (id !== "new" && !a) notFound();
  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader title={a ? tr(a.title, locale) : `${t.admin.nav.articles} — ${t.admin.content.new}`} actions={a && <>
        {a.isPublished && <a href={`/${locale}/blog/${a.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold"><ExternalLink className="h-4 w-4" />{t.common.view}</a>}
        <ConfirmForm action={deleteArticleAction.bind(null, locale, a.id)} confirm={t.admin.content.deleteConfirm}><Button variant="danger">{t.common.delete}</Button></ConfirmForm>
      </>} />
      <Card className="p-6"><ArticleForm a={a} locale={locale} t={t} /></Card>
    </div>
  );
}
