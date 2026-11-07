import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { createManualInvoiceAction } from "@/actions/admin/finance";
import { Card } from "@/components/ui/misc";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function NewInvoice({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string; ref?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const ti = t.admin.invoices;
  await requireStaff(locale, "finance.manage");
  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={ti.new} />
      <Card className="p-6">
        <ActionForm action={createManualInvoiceAction.bind(null, locale)} submitLabel={t.common.create}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={`${ti.customer} (${t.common.email})`} required><Input name="email" type="email" required defaultValue={sp.email} dir="ltr" /></Field>
            <Field label={`${t.common.reference} (VA-..)`}><Input name="reference" defaultValue={sp.ref} dir="ltr" /></Field>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{ti.items}</p>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_70px_120px] gap-2">
                <Input name={`items.${i}.description`} placeholder={ti.description} required={i === 0} />
                <Input name={`items.${i}.quantity`} type="number" min="1" defaultValue="1" aria-label={ti.quantity} />
                <Input name={`items.${i}.unitPrice`} type="number" step="0.01" min="0" placeholder={ti.unitPrice} required={i === 0} />
              </div>
            ))}
          </div>
          <Field label={`${t.apply.discount} (MAD)`} className="max-w-xs"><Input name="discount" type="number" step="0.01" min="0" /></Field>
          <Field label={t.common.notes}><Textarea name="notes" rows={2} /></Field>
          <Checkbox name="send" defaultChecked label={t.common.send + " (email)"} />
        </ActionForm>
      </Card>
    </div>
  );
}
