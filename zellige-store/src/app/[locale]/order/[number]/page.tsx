import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink, AlertTriangle } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDict, isLocale, tr, fmt } from "@/lib/i18n";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { formatMoney, MAD } from "@/lib/money";
import { courierName } from "@/lib/couriers";
import { countryName } from "@/lib/cart";

export const metadata = { robots: { index: false } };

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: string; number: string }>; searchParams: Promise<{ t?: string; paid?: string; payment?: string }> }) {
  const { locale, number } = await params;
  const sp = await searchParams;
  if (!isLocale(locale)) notFound();
  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const user = await getCurrentUser();
  const allowed = (sp.t && sp.t === order.accessToken) || (user && (user.id === order.userId || isStaff(user.role)));
  if (!allowed) notFound();
  const d = getDict(locale);
  const s = await getSettings();
  const m = (c: number) => formatMoney(c, locale, MAD);
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, { dateStyle: "medium", timeStyle: "short", numberingSystem: "latn" });
  const stepIndex = FLOW.indexOf(order.status);
  const fresh = Date.now() - order.createdAt.getTime() < 30 * 60_000;
  const awaitingCard = (order.paymentMethod === "CMI" || order.paymentMethod === "STRIPE") && order.paymentStatus !== "PAID";

  return (
    <div className="container max-w-4xl py-10 md:py-14">
      {fresh && (
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald" />
          <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">{fmt(d.order.thanks, { name: order.firstName })}</h1>
          <p className="mt-3 text-charcoal-600">{fmt(d.order.received, { number: order.number })}</p>
          <p className="mt-1 text-sm text-charcoal-500">{fmt(d.order.confirmEmail, { email: order.email })} {order.paymentMethod === "COD" && fmt(d.order.confirmCall, { phone: order.phone })}</p>
        </div>
      )}
      {!fresh && <h1 className="mb-6 font-display text-4xl font-semibold">{order.number}</h1>}

      {awaitingCard && (sp.payment === "failed" || sp.payment === "cancelled" || order.paymentStatus === "FAILED") && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-terracotta-50 p-5 text-terracotta-700">
          <AlertTriangle className="h-5 w-5" />
          <p className="flex-1 text-sm">{d.checkout.paymentFailed}</p>
          {order.paymentMethod === "CMI" && order.status !== "CANCELLED" && <Link href={`/${locale}/checkout/pay/${order.number}?t=${order.accessToken}`} className="btn-accent btn-sm">{d.checkout.payNow}</Link>}
        </div>
      )}

      {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" && (
        <div className="card mb-6 border-saffron bg-saffron-50 p-6">
          <h2 className="font-display text-2xl font-semibold">{d.order.bankTitle}</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
            {[["", s.payments.bankHolder], ["", s.payments.bankName], ["RIB", s.payments.rib], ["IBAN", s.payments.iban], ["SWIFT", s.payments.swift], [d.cart.total, m(order.total)]].filter(([, v]) => v).map(([k, v], i) => (
              <div key={i} className="contents"><dt className="text-charcoal-500">{k}</dt><dd className="font-mono" dir="ltr">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-sm font-medium">{fmt(d.order.bankHelp, { number: order.number })}</p>
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-charcoal-500">{d.order.orderNumber}</p>
            <p className="font-mono text-lg font-semibold" dir="ltr">{order.number}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-majorelle-50 px-3 py-1 text-sm font-semibold text-majorelle">{d.order.statuses[order.status]}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-ivory-200 text-charcoal-600"}`}>{d.order.payment}: {d.order.paymentStatuses[order.paymentStatus]}</span>
          </div>
        </div>
        {stepIndex >= 0 && (
          <ol className="mt-8 grid grid-cols-3 gap-y-6 sm:grid-cols-6">
            {FLOW.map((st, i) => (
              <li key={st} className="flex flex-col items-center gap-2 text-center">
                {i <= stepIndex ? <CheckCircle2 className="h-6 w-6 text-emerald" /> : <Circle className="h-6 w-6 text-charcoal/20" />}
                <span className={`text-xs ${i <= stepIndex ? "font-semibold" : "text-charcoal-400"}`}>{d.order.statuses[st]}</span>
              </li>
            ))}
          </ol>
        )}
        {(order.trackingNumber || order.deliveryMinDays) && (
          <div className="mt-8 grid gap-4 border-t border-charcoal/10 pt-6 text-sm sm:grid-cols-2">
            {order.deliveryMinDays && <div><p className="text-charcoal-500">{d.order.estimated}</p><p className="font-medium">{fmt(d.order.days, { min: order.deliveryMinDays, max: order.deliveryMaxDays ?? order.deliveryMinDays })}</p></div>}
            {order.trackingNumber && (
              <div>
                <p className="text-charcoal-500">{d.order.trackingNumber} · {courierName(order.carrier)}</p>
                <p className="font-mono font-medium" dir="ltr">{order.trackingNumber}</p>
                {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-majorelle">{d.order.trackParcel}<ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="mb-4 font-display text-2xl font-semibold">{d.order.items}</h2>
          <ul className="divide-y divide-charcoal/10">
            {order.items.map((it) => (
              <li key={it.id} className="flex gap-4 py-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ivory-200">{it.image && <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />}</div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{tr(it.name, locale)}</p>
                  {it.variantName && <p className="text-charcoal-500">{tr(it.variantName, locale)}</p>}
                  <p className="text-charcoal-500">{it.quantity} × {m(it.unitPrice)}</p>
                </div>
                <p className="text-sm font-medium">{m(it.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-charcoal/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>{d.cart.subtotal}</dt><dd>{m(order.subtotal)}</dd></div>
            {order.discountTotal > 0 && <div className="flex justify-between text-emerald-700"><dt>{d.cart.discount} {order.discountCode && `(${order.discountCode})`}</dt><dd>−{m(order.discountTotal)}</dd></div>}
            <div className="flex justify-between"><dt>{d.cart.shipping}</dt><dd>{order.shippingFee ? m(order.shippingFee) : d.checkout.freeShipping}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>{d.cart.total}</dt><dd>{m(order.total)}</dd></div>
          </dl>
        </div>
        <div className="space-y-6">
          <div className="card p-6 text-sm">
            <h2 className="mb-3 font-display text-2xl font-semibold">{d.order.deliveryTo}</h2>
            <p className="font-medium">{order.firstName} {order.lastName}</p>
            <p>{order.address}</p>
            <p>{order.city}{order.postalCode ? ` ${order.postalCode}` : ""}, {countryName(order.country, locale)}</p>
            <p dir="ltr" className="text-start">{order.phone}</p>
            <p className="mt-3 text-charcoal-500">{d.order.payment}: {d.checkout.methods[order.paymentMethod]}</p>
          </div>
          {order.events.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-3 font-display text-2xl font-semibold">{d.order.timeline}</h2>
              <ol className="space-y-3 border-s border-charcoal/15 ps-4 text-sm">
                {order.events.map((e) => (
                  <li key={e.id}>
                    <p className="font-medium">{e.status ? d.order.statuses[e.status] : e.note}</p>
                    {e.status && e.note && <p className="text-charcoal-600">{e.note}</p>}
                    <p className="text-xs text-charcoal-400">{dateFmt.format(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 text-center"><Link href={`/${locale}/shop`} className="btn-outline">{d.cart.continue}</Link></div>
    </div>
  );
}
