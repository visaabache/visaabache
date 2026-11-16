import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCmiHash } from "@/lib/payments/cmi";
import { markPaid } from "@/lib/orders";

export const runtime = "nodejs";

const text = (body: string) => new NextResponse(body, { headers: { "Content-Type": "text/plain" } });

/**
 * Server-to-server callback from CMI. An order is marked paid only when the HASH is valid,
 * the order exists and is a CMI order, the amount matches, and ProcReturnCode is "00".
 * The browser redirect to okUrl never confirms a payment on its own.
 */
export async function POST(req: Request) {
  const storeKey = process.env.CMI_STORE_KEY;
  if (!storeKey) return new NextResponse("FAILURE", { status: 503 });
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") params[k] = v;
  if (!verifyCmiHash(params, storeKey)) {
    console.warn("[cmi] invalid hash for oid", params.oid);
    return text("FAILURE");
  }
  const order = await prisma.order.findUnique({ where: { number: params.oid || "" } });
  if (!order || order.paymentMethod !== "CMI") return text("FAILURE");
  const amountOk = Math.abs(Number(params.amount) - order.total / 100) < 0.01;
  if (params.ProcReturnCode === "00" && amountOk) {
    await markPaid(order.number, params.TransId || params.AuthCode || "CMI", "cmi");
    return text("ACTION=POSTAUTH");
  }
  if (order.paymentStatus === "PENDING") {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    await prisma.orderEvent.create({ data: { orderId: order.id, note: `CMI: ${params.ErrMsg || params.Response || "declined"}`, actor: "cmi", visibleToCustomer: false } });
  }
  return text("APPROVED");
}
