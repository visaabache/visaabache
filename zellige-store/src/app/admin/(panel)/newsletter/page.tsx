import { prisma } from "@/lib/db";
import { deleteSubscriber } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton } from "@/components/admin/ui";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
  return (
    <>
      <PageHeader title="Newsletter" description={`${subs.length} subscribers. Export to your emailing tool (Brevo, Mailchimp…).`} actions={<a href="/api/admin/export?what=newsletter" className="btn-primary btn-sm">Export .csv</a>} />
      <div className="card divide-y divide-charcoal/5">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center gap-4 px-5 py-2.5 text-sm">
            <span className="flex-1">{s.email}</span>
            <span className="text-xs uppercase text-charcoal-500">{s.locale}</span>
            <span className="text-xs text-charcoal-500">{s.createdAt.toLocaleDateString("fr-MA")}</span>
            <ActionButton action={deleteSubscriber} fields={{ id: s.id }} variant="danger" confirm="Remove this subscriber?">Remove</ActionButton>
          </div>
        ))}
        {subs.length === 0 && <p className="p-8 text-center text-charcoal-500">No subscribers yet.</p>}
      </div>
    </>
  );
}
