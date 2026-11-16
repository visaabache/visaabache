import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { deletePage, savePage } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Card, I18nField, SubmitButton } from "@/components/admin/ui";

type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.page.findUnique({ where: { slug } });
  if (!p) notFound();
  return (
    <>
      <PageHeader title={tr(p.title, "fr")} actions={<><a href={`/fr/pages/${slug}`} target="_blank" className="btn-outline btn-sm">View</a><ActionButton action={deletePage} fields={{ slug }} variant="danger" confirm="Delete this page?">Delete</ActionButton><Link href="/admin/pages" className="btn-outline btn-sm">All pages</Link></>} />
      <Card>
        <AdminForm action={savePage} className="space-y-5">
          <input type="hidden" name="slug" value={slug} />
          <I18nField name="title" label="Title" value={p.title as I18n} required />
          <I18nField name="body" label="Content" value={p.body as I18n} multiline rows={22} hint="Blank line = new paragraph · “## ” heading · “### ” subheading · “- ” list item · **bold** · [link](https://…)" />
          <SubmitButton>Save</SubmitButton>
        </AdminForm>
      </Card>
    </>
  );
}
