"use server";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { setOrderStatus, orderUrl } from "@/lib/orders";
import { bool, str } from "@/lib/form";
import { trackingUrlFor, courierName } from "@/lib/couriers";
import { sendMail } from "@/lib/mail";
import { getDict, fmt, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";

const ORDER: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
const PAY: PaymentStatus[] = ["PENDING", "AWAITING_TRANSFER", "PAID", "FAILED", "REFUNDED"];

async function notify(orderId: string, note?: string) {
  const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const locale = o.locale as Locale;
  const d = getDict(locale);
  const s = await getSettings();
  const lines = [
    `${d.order.orderNumber}: ${o.number}`,
    `${d.order.status}: ${d.order.statuses[o.status]}`,
    note || "",
    o.trackingNumber ? `${d.order.trackingNumber} (${courierName(o.carrier)}): ${o.trackingNumber}${o.trackingUrl ? `\n${o.trackingUrl}` : ""}` : "",
    "",
    orderUrl(o),
    "",
    s.store.name,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
  await sendMail(o.email, `${s.store.name}: ${o.number} · ${d.order.statuses[o.status]}`, `${fmt(d.order.thanks, { name: o.firstName })}\n\n${lines.join("\n")}`);
}

export async function updateOrderStatus(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as OrderStatus;
  if (!ORDER.includes(status)) return { error: "Invalid status" };
  const note = str(fd, "note", 1000);
  await setOrderStatus(id, status, { note, actor: admin.email, visible: !bool(fd, "internal") });
  await audit(admin.email, "order.status", id, { status });
  if (bool(fd, "notify")) await notify(id, bool(fd, "internal") ? undefined : note);
  return { ok: true, message: bool(fd, "notify") ? "Updated and customer notified" : "Updated" };
}

export async function updatePayment(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const paymentStatus = str(fd, "paymentStatus") as PaymentStatus;
  if (!PAY.includes(paymentStatus)) return { error: "Invalid payment status" };
  const ref = str(fd, "paymentRef", 120);
  const o = await prisma.order.update({ where: { id }, data: { paymentStatus, paymentRef: ref || undefined, paidAt: paymentStatus === "PAID" ? new Date() : undefined } });
  await prisma.orderEvent.create({ data: { orderId: id, note: `Payment: ${paymentStatus}${ref ? ` (${ref})` : ""}`, actor: admin.email, visibleToCustomer: paymentStatus === "PAID" || paymentStatus === "REFUNDED" } });
  if (paymentStatus === "PAID" && o.status === "PENDING") await setOrderStatus(id, "CONFIRMED", { actor: admin.email });
  await audit(admin.email, "order.payment", id, { paymentStatus });
  return { ok: true };
}

export async function updateShipment(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const carrier = str(fd, "carrier", 40) || null;
  const trackingNumber = str(fd, "trackingNumber", 80) || null;
  const trackingUrl = str(fd, "trackingUrl", 500) || trackingUrlFor(carrier, trackingNumber);
  if (trackingUrl && !/^https:\/\//.test(trackingUrl)) return { error: "Tracking link must start with https://" };
  await prisma.order.update({ where: { id }, data: { carrier, trackingNumber, trackingUrl } });
  const markShipped = bool(fd, "markShipped");
  if (markShipped) await setOrderStatus(id, "SHIPPED", { actor: admin.email, note: trackingNumber ? `${courierName(carrier)} ${trackingNumber}` : undefined });
  if (bool(fd, "notify")) await notify(id);
  await audit(admin.email, "order.shipment", id);
  return { ok: true };
}

export async function addOrderNote(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const note = str(fd, "note", 2000);
  if (!note) return { error: "Write a note." };
  await prisma.orderEvent.create({ data: { orderId: str(fd, "id"), note, actor: admin.email, visibleToCustomer: false } });
  return { ok: true };
}
