import type { Testimonial } from "@prisma/client";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { deleteTestimonial, saveTestimonial } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Badge, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Testimonials" };
type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;

function Fields({ t }: { t?: Testimonial }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Customer name"><input name="name" required defaultValue={t?.name} className="field" /></Field>
      <Field label="City"><input name="city" defaultValue={t?.city ?? ""} className="field" /></Field>
      <Field label="Rating"><select name="rating" defaultValue={t?.rating ?? 5} className="field">{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></Field>
      <Field label="Sort"><input name="sortOrder" type="number" defaultValue={t?.sortOrder ?? 0} className="field" /></Field>
      <div className="md:col-span-4"><I18nField name="quote" label="Their words" value={(t?.quote as I18n) ?? null} multiline rows={2} required hint="Use real customer feedback only, with their permission." /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={t?.isPublished ?? false} className="h-4 w-4 accent-majorelle" />Published on the homepage</label>
    </div>
  );
}

export default async function TestimonialsPage() {
  const rows = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Testimonials" description="The homepage section appears once at least one testimonial is published." />
      <Card title="Add a testimonial" className="mb-6"><AdminForm action={saveTestimonial} resetOnSuccess className="space-y-4"><Fields /><SubmitButton>Add</SubmitButton></AdminForm></Card>
      <div className="space-y-3">
        {rows.map((t) => (
          <details key={t.id} className="card">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm">
              <span className="font-semibold">{t.name}</span><span className="flex-1 truncate text-charcoal-500">“{tr(t.quote, "fr")}”</span>
              <Badge tone={t.isPublished ? "green" : "neutral"}>{t.isPublished ? "published" : "hidden"}</Badge>
            </summary>
            <div className="border-t border-charcoal/5 p-4">
              <AdminForm action={saveTestimonial} className="space-y-4"><Fields t={t} /><SubmitButton>Save</SubmitButton></AdminForm>
              <div className="mt-3"><ActionButton action={deleteTestimonial} fields={{ id: t.id }} variant="danger" confirm="Delete?">Delete</ActionButton></div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
