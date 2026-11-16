import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import { COURIERS, courierName } from "@/lib/couriers";
import { countryName } from "@/lib/cart";
import { orderUrl } from "@/lib/orders";
import { addOrderNote, updateOrderStatus, updatePayment, updateShipment } from "@/actions/admin/orders";
import { PageHeader } from "@/components/admin/AdminNav";
import { AdminForm, Badge, Card, Field, SubmitButton } from "@/components/admin/ui";
import { METHOD_LABEL, ORDER_LABEL, ORDER_TONE, PAY_LABEL, PAY_TONE } from "@/components/admin/labels";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const o = await prisma.order.findUnique({ where: { id: (await params).id }, select: { number: true } });
  return { title: o?.number ?? "Order" };
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: { select: { id: true } } } }, events: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, email: true } } } });
  if (!o) notFound();
  const previous = await prisma.order.count({ where: { email: o.email, id: { not: o.id } } });
  const m = (c: number) => formatMoney(c, "fr");
  const date = new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" });
  const wa = o.phone.replace(/\D/g, "").replace(/^0/, "212");

  return (
    <>
      <PageHeader
        title={o.number}
        description={`${date.format(o.createdAt)} · ${o.locale.toUpperCase()} · ${METHOD_LABEL[o.paymentMethod]}${o.currency !== "MAD" ? ` · shown in ${o.currency}` : ""}`}
        actions={<><Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge><Badge tone={PAY_TONE[o.paymentStatus]}>{PAY_LABEL[o.paymentStatus]}</Badge><a href={orderUrl(o)} target="_blank" className="btn-outline btn-sm">Customer view <ExternalLink className="h-3.5 w-3.5" /></a><Link href="/admin/orders" className="btn-outline btn-sm">All orders</Link></>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-charcoal/5">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-ivory-200">{it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />}</div>
                  <div className="flex-1 text-sm">
                    {it.product ? <Link href={`/admin/products/${it.product.id}`} className="font-medium hover:underline">{tr(it.name, "fr")}</Link> : <span className="font-medium">{tr(it.name, "fr")}</span>}
                    {it.variantName && <span className="block text-charcoal-500">{tr(it.variantName, "fr")}</span>}
                    <span className="block font-mono text-xs text-charcoal-500">{it.sku}</span>
                  </div>
                  <span className="text-sm">{it.quantity} × {m(it.unitPrice)}</span>
                  <span className="w-28 text-end text-sm font-semibold">{m(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="ms-auto mt-4 max-w-xs space-y-1 border-t border-charcoal/10 pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{m(o.subtotal)}</dd></div>
              {o.discountTotal > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {o.discountCode}</dt><dd>−{m(o.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery ({o.shippingLabel})</dt><dd>{m(o.shippingFee)}</dd></div>
              <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd>{m(o.total)}</dd></div>
              {o.paymentMethod === "COD" && o.paymentStatus !== "PAID" && <div className="flex justify-between text-saffron-700"><dt>To collect on delivery</dt><dd>{m(o.total)}</dd></div>}
            </dl>
          </Card>

          <Card title="Order status">
            <AdminForm action={updateOrderStatus} className="space-y-4">
              <input type="hidden" name="id" value={o.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <select name="status" defaultValue={o.status} className="field">
                    {Object.entries(ORDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Note (optional)"><input name="note" className="field" placeholder="e.g. Confirmed by phone" /></Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="notify" className="h-4 w-4 accent-majorelle" />Email the customer</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="internal" className="h-4 w-4 accent-majorelle" />Internal (hide from customer)</label>
              </div>
              <p className="text-xs text-charcoal-500">Cancelled or returned puts the items back in stock.</p>
              <SubmitButton>Update status</SubmitButton>
            </AdminForm>
          </Card>

          <Card title="Shipment">
            <AdminForm action={updateShipment} className="space-y-4">
              <input type="hidden" name="id" value={o.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Carrier">
                  <select name="carrier" defaultValue={o.carrier ?? ""} className="field">
                    <option value="">—</option>
                    {COURIERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Tracking number"><input name="trackingNumber" defaultValue={o.trackingNumber ?? ""} className="field font-mono" /></Field>
                <Field label="Tracking link" hint="Filled automatically for known carriers"><input name="trackingUrl" defaultValue={o.trackingUrl ?? ""} className="field text-sm" placeholder="https://" /></Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="markShipped" defaultChecked={o.status !== "SHIPPED" && o.status !== "DELIVERED"} className="h-4 w-4 accent-majorelle" />Mark as shipped</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="notify" className="h-4 w-4 accent-majorelle" />Email tracking to the customer</label>
              </div>
              <SubmitButton>Save shipment</SubmitButton>
              {o.trackingUrl && <a href={o.trackingUrl} target="_blank" className="ms-3 text-sm text-majorelle">Open tracking ({courierName(o.carrier)})</a>}
            </AdminForm>
          </Card>

          <Card title="History and notes">
            <AdminForm action={addOrderNote} resetOnSuccess className="mb-5 flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              <input name="note" placeholder="Add an internal note" className="field py-2" />
              <SubmitButton variant="outline">Add</SubmitButton>
            </AdminForm>
            <ol className="space-y-3 border-s border-charcoal/15 ps-4 text-sm">
              {o.events.map((e) => (
                <li key={e.id}>
                  <p>{e.status && <Badge tone={ORDER_TONE[e.status]}>{ORDER_LABEL[e.status]}</Badge>} {e.note} {!e.visibleToCustomer && <em className="text-xs text-charcoal-400">(internal)</em>}</p>
                  <p className="text-xs text-charcoal-400">{date.format(e.createdAt)} · {e.actor}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{o.firstName} {o.lastName}</p>
              <p><a href={`mailto:${o.email}`} className="hover:underline">{o.email}</a></p>
              <p dir="ltr" className="text-start">{o.phone}</p>
              <p className="text-charcoal-500">{previous ? `${previous} other order(s) with this email` : "First order"}{o.user ? " · has an account" : " · guest"}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <a href={`tel:${o.phone}`} className="btn-outline btn-sm"><Phone className="h-3.5 w-3.5" />Call</a>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${o.firstName}, concernant votre commande ${o.number}`)}`} target="_blank" className="btn-outline btn-sm"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
            </div>
          </Card>
          <Card title="Delivery address">
            <div className="space-y-1 text-sm">
              <p>{o.address}</p>
              <p>{o.city}{o.postalCode ? ` ${o.postalCode}` : ""}</p>
              <p>{countryName(o.country, "fr")}</p>
              {o.deliveryMinDays && <p className="text-charcoal-500">Promised: {o.deliveryMinDays}–{o.deliveryMaxDays} days</p>}
              {o.notes && <p className="mt-3 rounded-lg bg-saffron-50 p-3"><strong>Customer note:</strong> {o.notes}</p>}
            </div>
          </Card>
          <Card title="Payment">
            <p className="mb-3 text-sm">{METHOD_LABEL[o.paymentMethod]} · <Badge tone={PAY_TONE[o.paymentStatus]}>{PAY_LABEL[o.paymentStatus]}</Badge>{o.paymentRef && <span className="mt-1 block font-mono text-xs text-charcoal-500">{o.paymentRef}</span>}</p>
            <AdminForm action={updatePayment} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <Field label="Payment status">
                <select name="paymentStatus" defaultValue={o.paymentStatus} className="field">
                  {Object.entries(PAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Reference" hint="Transfer reference, receipt number…"><input name="paymentRef" className="field" /></Field>
              <SubmitButton variant="outline">Update payment</SubmitButton>
            </AdminForm>
          </Card>
        </div>
      </div>
    </>
  );
}
