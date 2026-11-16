import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma, type OrderStatus, type PaymentMethod } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "./db";
import { quoteCart, type QuoteInput } from "./cart";
import { getDict, tr, fmt, type Locale } from "./i18n";
import { formatMoney } from "./money";
import { sendMail } from "./mail";
import { getSettings } from "./settings";
import { siteUrl } from "./utils";
import { CATALOG_TAG } from "./catalog";

export class CheckoutError extends Error {
  constructor(public code: "EMPTY" | "STOCK" | "NO_SHIPPING" | "PAYMENT_METHOD" | "DISCOUNT" | "CHANGED") {
    super(code);
  }
}

export type CheckoutInput = QuoteInput & {
  paymentMethod: PaymentMethod;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  cityName: string;
  address: string;
  postalCode?: string;
  notes?: string;
  locale: Locale;
  currency: string;
  exchangeRate: number;
  userId?: string | null;
  /** Total the customer saw; the order is refused if prices changed meanwhile. */
  expectedTotal?: number;
};

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const rnd = [...randomBytes(5)].map((b) => alphabet[b % alphabet.length]).join("");
  return `DZ-${ymd}-${rnd}`;
}

export async function createOrder(input: CheckoutInput) {
  const quote = await quoteCart(input, input.locale);
  const lines = quote.lines.filter((l) => l.quantity > 0);
  if (!lines.length) throw new CheckoutError("EMPTY");
  if (quote.lines.some((l) => l.status !== "ok")) throw new CheckoutError("STOCK");
  if (!quote.shipping || !quote.shipping.available) throw new CheckoutError("NO_SHIPPING");
  if (!quote.paymentMethods.includes(input.paymentMethod)) throw new CheckoutError("PAYMENT_METHOD");
  if (input.code && !quote.discount?.ok) throw new CheckoutError("DISCOUNT");
  if (input.expectedTotal !== undefined && input.expectedTotal !== quote.totals.total) throw new CheckoutError("CHANGED");

  const order = await prisma.$transaction(async (tx) => {
    // Reserve stock atomically: the conditional update fails if someone bought the last piece meanwhile.
    for (const l of lines) {
      const res = l.variantId
        ? await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } })
        : await tx.product.updateMany({ where: { id: l.productId, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } });
      if (res.count !== 1) throw new CheckoutError("STOCK");
      await tx.product.update({ where: { id: l.productId }, data: { salesCount: { increment: l.quantity } } });
    }
    if (quote.discount?.ok) {
      const res = await tx.$executeRaw`UPDATE "DiscountCode" SET "usedCount" = "usedCount" + 1
        WHERE code = ${quote.discount.code} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
      if (res !== 1) throw new CheckoutError("DISCOUNT");
    }
    const shipping = quote.shipping as Extract<typeof quote.shipping, { available: true }>;
    const data: Prisma.OrderCreateInput = {
      number: orderNumber(),
      accessToken: randomBytes(24).toString("base64url"),
      user: input.userId ? { connect: { id: input.userId } } : undefined,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_TRANSFER" : "PENDING",
      email: input.email.toLowerCase(),
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      country: (input.country || "MA").toUpperCase(),
      city: input.cityName,
      address: input.address,
      postalCode: input.postalCode || null,
      notes: input.notes || null,
      locale: input.locale,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      subtotal: quote.totals.subtotal,
      discountTotal: quote.totals.discount,
      shippingFee: quote.totals.shipping,
      total: quote.totals.total,
      discountCode: quote.discount?.ok ? quote.discount.code : null,
      shippingLabel: shipping.label || input.cityName,
      deliveryMinDays: shipping.minDays,
      deliveryMaxDays: shipping.maxDays,
      items: {
        create: lines.map((l) => ({
          product: { connect: { id: l.productId } },
          variant: l.variantId ? { connect: { id: l.variantId } } : undefined,
          sku: l.sku,
          name: l.name,
          variantName: l.variantName ?? undefined,
          image: l.image,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
        })),
      },
      events: { create: { status: "PENDING", note: null, actor: "customer" } },
    };
    for (let attempt = 0; ; attempt++) {
      try {
        return await tx.order.create({ data, include: { items: true } });
      } catch (e) {
        if (attempt < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          data.number = orderNumber();
          continue;
        }
        throw e;
      }
    }
  });

  revalidateTag(CATALOG_TAG);
  // Notifications must never break checkout.
  notifyOrderPlaced(order.id).catch((e) => console.error("[order] notify failed", e));
  checkLowStock(lines.map((l) => l.productId)).catch(() => {});
  return order;
}

/** Cancelling or returning an order puts the reserved stock back (once). */
export async function setOrderStatus(orderId: string, status: OrderStatus, opts: { note?: string; actor: string; visible?: boolean }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status === status) return order;
    const restocks = (s: OrderStatus) => s === "CANCELLED" || s === "RETURNED";
    if (restocks(status) && !restocks(order.status)) {
      for (const it of order.items) {
        if (it.variantId) await tx.productVariant.updateMany({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
        else if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
        if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { salesCount: { decrement: it.quantity } } });
      }
    } else if (!restocks(status) && restocks(order.status)) {
      for (const it of order.items) {
        if (it.variantId) await tx.productVariant.updateMany({ where: { id: it.variantId }, data: { stock: { decrement: it.quantity } } });
        else if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
        if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { salesCount: { increment: it.quantity } } });
      }
    }
    const updated = await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderEvent.create({ data: { orderId, status, note: opts.note || null, actor: opts.actor, visibleToCustomer: opts.visible ?? true } });
    return updated;
  });
}

export async function markPaid(orderNumber: string, ref: string, actor: string) {
  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order || order.paymentStatus === "PAID") return order;
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", paidAt: new Date(), paymentRef: ref, status: order.status === "PENDING" ? "CONFIRMED" : order.status },
  });
  await prisma.orderEvent.create({ data: { orderId: order.id, status: updated.status, note: `Payment received (${ref})`, actor } });
  return updated;
}

export const orderUrl = (o: { number: string; accessToken: string; locale: string }) =>
  `${siteUrl()}/${o.locale}/order/${o.number}?t=${o.accessToken}`;

async function notifyOrderPlaced(orderId: string) {
  const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  const locale = o.locale as Locale;
  const d = getDict(locale);
  const s = await getSettings();
  const lines = o.items.map((i) => `• ${tr(i.name, locale)}${i.variantName ? ` (${tr(i.variantName, locale)})` : ""} × ${i.quantity}: ${formatMoney(i.lineTotal, locale)}`);
  const text = [
    fmt(d.order.thanks, { name: o.firstName }),
    fmt(d.order.received, { number: o.number }),
    "",
    ...lines,
    `${d.cart.shipping}: ${formatMoney(o.shippingFee, locale)}`,
    o.discountTotal ? `${d.cart.discount}: -${formatMoney(o.discountTotal, locale)}` : "",
    `${d.cart.total}: ${formatMoney(o.total, locale)}`,
    `${d.order.payment}: ${d.checkout.methods[o.paymentMethod]}`,
    o.paymentMethod === "BANK_TRANSFER" ? `\n${d.order.bankTitle}\n${s.payments.bankHolder}\n${s.payments.bankName}\nRIB: ${s.payments.rib}\nIBAN: ${s.payments.iban}\nSWIFT: ${s.payments.swift}\n${fmt(d.order.bankHelp, { number: o.number })}` : "",
    "",
    orderUrl(o),
    "",
    s.store.name,
  ].filter((x) => x !== "").join("\n");
  await sendMail(o.email, `${s.store.name}: ${o.number}`, text);
  const staff = s.inventory.alertEmail || s.store.email;
  if (staff) await sendMail(staff, `New order ${o.number}: ${formatMoney(o.total, "fr")}`, `${o.firstName} ${o.lastName}, ${o.city}, ${o.phone}\n${lines.join("\n")}\n\n${siteUrl()}/admin/orders/${o.id}`);
}

async function checkLowStock(productIds: string[]) {
  const s = await getSettings();
  const to = s.inventory.alertEmail || s.store.email;
  if (!to) return;
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { variants: { where: { isActive: true } } } });
  const low = products.flatMap((p) => {
    const threshold = p.lowStockThreshold ?? s.inventory.lowStockThreshold;
    if (p.variants.length) return p.variants.filter((v) => v.stock <= threshold).map((v) => `${v.sku}: ${v.stock}`);
    return p.stock <= threshold ? [`${p.sku}: ${p.stock}`] : [];
  });
  if (low.length) await sendMail(to, `Low stock: ${low.length} item(s)`, `${low.join("\n")}\n\n${siteUrl()}/admin/products?stock=low`);
}
