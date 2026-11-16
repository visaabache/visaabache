import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { verifyStripeSignature } from "@/lib/payments/stripe";

export const runtime = "nodejs";

type Event = { type: string; data: { object: { id: string; client_reference_id?: string; payment_status?: string; payment_intent?: string } } };

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("not configured", { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) return new NextResponse("bad signature", { status: 400 });
  const event = JSON.parse(payload) as Event;
  const s = event.data.object;
  if (event.type === "checkout.session.completed" && s.payment_status === "paid" && s.client_reference_id) {
    const order = await prisma.order.findUnique({ where: { number: s.client_reference_id } });
    // The session id stored at checkout must match: a session for another order cannot pay this one.
    if (order && order.paymentMethod === "STRIPE" && order.paymentRef === s.id) await markPaid(order.number, s.payment_intent || s.id, "stripe");
  }
  if (event.type === "checkout.session.expired" && s.client_reference_id) {
    await prisma.order.updateMany({ where: { number: s.client_reference_id, paymentStatus: "PENDING", paymentRef: s.id }, data: { paymentStatus: "FAILED" } });
  }
  return NextResponse.json({ received: true });
}
