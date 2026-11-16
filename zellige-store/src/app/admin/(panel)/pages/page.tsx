import Link from "next/link";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { savePage } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { AdminForm, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function PagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <PageHeader title="Pages" description="Legal and help pages, in three languages. Placeholders {store}, {email}, {phone}, {address}, {legalName}, {ice} are replaced from Settings." />
      <div className="card mb-6 divide-y divide-charcoal/5">
        {pages.map((p) => (
          <Link key={p.slug} href={`/admin/pages/${p.slug}`} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-ivory-100">
            <span className="flex-1 font-semibold">{tr(p.title, "fr")}</span>
            <span className="font-mono text-xs text-charcoal-500">/pages/{p.slug}</span>
            <span className="text-xs text-charcoal-500">{["fr", "ar", "en"].filter((l) => (p.body as Record<string, string>)[l]).join(" · ").toUpperCase()}</span>
          </Link>
        ))}
      </div>
      <Card title="New page">
        <AdminForm action={savePage} className="space-y-4">
          <input type="hidden" name="isNew" value="1" />
          <Field label="Slug"><input name="slug" required pattern="[a-z0-9-]{2,60}" className="field max-w-xs font-mono" /></Field>
          <I18nField name="title" label="Title" required />
          <SubmitButton>Create</SubmitButton>
        </AdminForm>
      </Card>
    </>
  );
}
