import { z } from "zod";
import { prisma } from "@/lib/db";
import { asLocale } from "@/lib/i18n/config";
import { json, sameOrigin } from "@/lib/http";
import { createOrder, CheckoutError } from "@/lib/orders";
import { getCurrencies } from "@/lib/currency";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail, isPhone, normalizePhone, siteUrl } from "@/lib/utils";
import { convert } from "@/lib/money";
import { createStripeSession, stripeChargeCurrency } from "@/lib/payments/stripe";

export const runtime = "nodejs";

const text = (max: number) => z.string().trim().max(max);

const schema = z.object({
  lines: z.array(z.object({ productId: z.string().max(40), variantId: z.string().max(40).nullish(), quantity: z.number().int().min(1).max(99) })).min(1).max(100),
  country: z.string().length(2),
  cityId: z.string().max(40).nullish(),
  cityName: text(80).min(2),
  code: text(40).nullish(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "CMI", "STRIPE"]),
  email: text(200).refine(isEmail),
  phone: text(30).refine(isPhone),
  firstName: text(60).min(1),
  lastName: text(60).min(1),
  address: text(300).min(4),
  postalCode: text(20).optional(),
  notes: text(1000).optional(),
  locale: z.string(),
  currency: z.string().max(3).optional(),
  expectedTotal: z.number().int().optional(),
  createAccount: z.boolean().optional(),
  password: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  if (!rateLimit(`checkout:${await clientIp()}`, 15, 600_000)) return json({ error: "rate" }, 429);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid", fields: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  const input = parsed.data;
  const locale = asLocale(input.locale);
  const email = input.email.toLowerCase();

  let user = await getCurrentUser();
  if (!user && input.createAccount && input.password && input.password.length >= 8) {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!exists) {
      const created = await prisma.user.create({
        data: { email, name: `${input.firstName} ${input.lastName}`, phone: normalizePhone(input.phone), locale, country: input.country, city: input.cityName, address: input.address, passwordHash: await hashPassword(input.password) },
      });
      await createSession(created);
      user = { id: created.id, email, name: created.name, phone: created.phone, role: created.role, locale, country: created.country, city: created.city, address: created.address };
    }
  }

  const currency = (await getCurrencies()).find((c) => c.code === input.currency) ?? { code: "MAD", rate: 1, decimals: 2, symbol: "DH" };
  try {
    const order = await createOrder({
      ...input,
      email,
      phone: normalizePhone(input.phone),
      locale,
      currency: currency.code,
      exchangeRate: currency.rate,
      userId: user?.id ?? null,
    });
    const orderPage = `/${locale}/order/${order.number}?t=${order.accessToken}`;
    if (order.paymentMethod === "CMI") return json({ ok: true, redirect: `/${locale}/checkout/pay/${order.number}?t=${order.accessToken}` });
    if (order.paymentMethod === "STRIPE") {
      const chargeCurrency = stripeChargeCurrency(currency.code);
      const rate = chargeCurrency === currency.code ? currency : { code: "MAD", rate: 1, decimals: 2, symbol: "DH" };
      const amountMinor = Math.round(convert(order.total, rate) * 100);
      const session = await createStripeSession({
        orderNumber: order.number,
        amountMinor,
        currency: chargeCurrency,
        description: `Order ${order.number}`,
        email,
        successUrl: `${siteUrl()}${orderPage}&paid=1`,
        cancelUrl: `${siteUrl()}${orderPage}&payment=cancelled`,
        locale,
      });
      await prisma.order.update({ where: { id: order.id }, data: { paymentRef: session.id } });
      return json({ ok: true, redirect: session.url });
    }
    return json({ ok: true, redirect: orderPage });
  } catch (e) {
    if (e instanceof CheckoutError) return json({ error: e.code }, 409);
    console.error("[checkout]", e);
    return json({ error: "server" }, 500);
  }
}
