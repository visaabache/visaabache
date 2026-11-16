import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { saveCollection } from "@/actions/admin/catalog";
import { PageHeader } from "@/components/admin/AdminNav";
import { AdminForm, Badge, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const rows = await prisma.collection.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { _count: { select: { products: true } } } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Collections" description="Group products for the homepage, gift selections or time-limited promotions." />
      <Card title="New collection" className="mb-6">
        <AdminForm action={saveCollection} className="grid gap-4 md:grid-cols-2">
          <I18nField name="name" label="Name" required />
          <Field label="Slug" hint="Empty = generated from the name"><input name="slug" className="field font-mono text-sm" /></Field>
          <input type="hidden" name="isActive" value="on" />
          <div className="md:col-span-2"><SubmitButton>Create and choose products</SubmitButton></div>
        </AdminForm>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => {
          const scheduled = (c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now);
          return (
            <Link key={c.id} href={`/admin/collections/${c.id}`} className="card overflow-hidden transition hover:shadow-card">
              <div className="relative aspect-[16/9] bg-ivory-200">{c.image && <Image src={c.image} alt="" fill sizes="400px" className="object-cover" />}</div>
              <div className="p-4">
                <p className="font-semibold">{tr(c.name, "fr")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="blue">{c._count.products} products</Badge>
                  {c.featured && <Badge tone="yellow">homepage</Badge>}
                  {c.isGift && <Badge tone="red">gifts</Badge>}
                  {!c.isActive && <Badge>inactive</Badge>}
                  {scheduled && <Badge>outside dates</Badge>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
