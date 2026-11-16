import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDict, isLocale } from "@/lib/i18n";
import { buildCmiRequest } from "@/lib/payments/cmi";
import { siteUrl } from "@/lib/utils";
import { AutoSubmit } from "@/components/checkout/AutoSubmit";

export const metadata = { robots: { index: false } };

/** Hands the customer over to the CMI hosted payment page with a signed form. */
export default async function PayPage({ params, searchParams }: { params: Promise<{ locale: string; number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { locale, number } = await params;
  const { t } = await searchParams;
  if (!isLocale(locale)) notFound();
  const order = await prisma.order.findUnique({ where: { number } });
  if (!order || !t || order.accessToken !== t) notFound();
  const orderPage = `/${locale}/order/${order.number}?t=${order.accessToken}`;
  if (order.paymentMethod !== "CMI" || order.paymentStatus === "PAID" || order.status === "CANCELLED") redirect(orderPage);
  const d = getDict(locale);
  const base = siteUrl();
  const { url, params: fields } = buildCmiRequest({
    orderNumber: order.number,
    amountMad: order.total / 100,
    okUrl: `${base}${orderPage}&paid=1`,
    failUrl: `${base}${orderPage}&payment=failed`,
    callbackUrl: `${base}/api/payments/cmi/callback`,
    shopUrl: `${base}/${locale}`,
    lang: locale,
    email: order.email,
    name: `${order.firstName} ${order.lastName}`,
    phone: order.phone,
  });
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-lg">{d.checkout.redirecting}</p>
      <AutoSubmit action={url} fields={fields} label={d.checkout.payNow} />
    </div>
  );
}
