import { prisma } from "@/lib/db";
import { centsToInput, formatMoney } from "@/lib/money";
import { deleteDiscount, saveDiscount } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Badge, Card, Field, SubmitButton } from "@/components/admin/ui";
import type { DiscountCode } from "@prisma/client";

export const metadata = { title: "Discount codes" };
const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function Fields({ d }: { d?: DiscountCode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {d && <input type="hidden" name="id" value={d.id} />}
      <Field label="Code"><input name="code" required defaultValue={d?.code} className="field font-mono uppercase" placeholder="RAMADAN10" /></Field>
      <Field label="Type">
        <select name="type" defaultValue={d?.type ?? "PERCENT"} className="field">
          <option value="PERCENT">Percentage off</option>
          <option value="FIXED">Fixed amount off (MAD)</option>
          <option value="FREE_SHIPPING">Free delivery</option>
        </select>
      </Field>
      <Field label="Value" hint="10 = 10% or 10 MAD"><input name="value" defaultValue={d ? (d.type === "FIXED" ? centsToInput(d.value) : d.value) : ""} className="field" /></Field>
      <Field label="Minimum order (MAD)"><input name="minSubtotal" defaultValue={d ? centsToInput(d.minSubtotal) : ""} className="field" /></Field>
      <Field label="Max uses" hint="Empty = unlimited"><input name="maxUses" type="number" min={1} defaultValue={d?.maxUses ?? ""} className="field" /></Field>
      <Field label="Starts"><input name="startsAt" type="datetime-local" defaultValue={local(d?.startsAt ?? null)} className="field" /></Field>
      <Field label="Ends"><input name="endsAt" type="datetime-local" defaultValue={local(d?.endsAt ?? null)} className="field" /></Field>
      <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isActive" defaultChecked={d?.isActive ?? true} className="h-4 w-4 accent-majorelle" />Active</label>
    </div>
  );
}

export default async function DiscountsPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Discount codes" description="Customers enter codes at checkout." />
      <Card title="New code" className="mb-6"><AdminForm action={saveDiscount} resetOnSuccess className="space-y-4"><Fields /><SubmitButton>Create code</SubmitButton></AdminForm></Card>
      <div className="space-y-3">
        {codes.map((d) => (
          <details key={d.id} className="card group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
              <span className="font-mono text-base font-semibold">{d.code}</span>
              <Badge tone="blue">{d.type === "PERCENT" ? `−${d.value}%` : d.type === "FIXED" ? `−${formatMoney(d.value, "fr")}` : "Free delivery"}</Badge>
              {d.minSubtotal > 0 && <span className="text-xs text-charcoal-500">min {formatMoney(d.minSubtotal, "fr")}</span>}
              <span className="text-xs text-charcoal-500">used {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ""}</span>
              {!d.isActive && <Badge>inactive</Badge>}
              {d.endsAt && d.endsAt < new Date() && <Badge tone="red">expired</Badge>}
              <span className="ms-auto text-sm text-majorelle">Edit</span>
            </summary>
            <div className="border-t border-charcoal/5 p-4">
              <AdminForm action={saveDiscount} className="space-y-4"><Fields d={d} /><SubmitButton>Save</SubmitButton></AdminForm>
              <div className="mt-3"><ActionButton action={deleteDiscount} fields={{ id: d.id }} variant="danger" confirm="Delete this code?">Delete</ActionButton></div>
            </div>
          </details>
        ))}
        {codes.length === 0 && <p className="text-sm text-charcoal-500">No codes yet.</p>}
      </div>
    </>
  );
}
