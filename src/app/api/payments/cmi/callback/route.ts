import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyCmiHash } from "@/lib/payments/cmi";
import { confirmPayment } from "@/lib/domain/payments";
import { toNumber } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Server-to-server callback from CMI. A payment is marked CONFIRMED only if:
 *  1. the HASH signature is valid (store key),
 *  2. the order id matches a pending CMI payment,
 *  3. the amount matches,
 *  4. ProcReturnCode === "00" (approved).
 * The browser "okUrl" redirect never confirms anything by itself.
 */
export async function POST(req: Request) {
  const storeKey = process.env.CMI_STORE_KEY;
  if (!storeKey) return new NextResponse("FAILURE", { status: 503 });
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") params[k] = v;

  if (!verifyCmiHash(params, storeKey)) {
    console.warn("[cmi] invalid hash for oid", params.oid);
    return new NextResponse("FAILURE", { headers: { "Content-Type": "text/plain" } });
  }
  const payment = await prisma.payment.findUnique({ where: { reference: params.oid || "" } });
  if (!payment || payment.provider !== "CMI") return new NextResponse("FAILURE", { headers: { "Content-Type": "text/plain" } });

  const payload = { ...params, HASH: undefined } as unknown as Prisma.InputJsonValue;
  const approved = params.ProcReturnCode === "00" && Math.abs(Number(params.amount) - toNumber(payment.amount)) < 0.01;

  if (approved) {
    await confirmPayment(payment.id, { providerTxnId: params.TransId || params.TRANID || undefined, providerPayload: payload, note: "CMI callback (hash verified)" });
    // Ask CMI to capture the pre-authorisation.
    return new NextResponse("ACTION=POSTAUTH", { headers: { "Content-Type": "text/plain" } });
  }
  if (payment.status === "PENDING") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerPayload: payload, verificationNote: `CMI: ${params.ErrMsg || params.Response || "declined"}` } });
  }
  return new NextResponse("APPROVED", { headers: { "Content-Type": "text/plain" } });
}
