import { createHmac, timingSafeEqual } from "node:crypto";

/** Currencies the shop charges in directly through Stripe; anything else is charged in MAD. */
const STRIPE_CURRENCIES = new Set(["EUR", "USD", "GBP", "CAD", "CHF", "MAD"]);

export const stripeChargeCurrency = (display: string) => (STRIPE_CURRENCIES.has(display) ? display : "MAD");

/** Creates a hosted Stripe Checkout session through the REST API (no SDK needed). */
export async function createStripeSession(input: {
  orderNumber: string;
  amountMinor: number;
  currency: string;
  description: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  locale: string;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.orderNumber,
    customer_email: input.email,
    locale: input.locale === "ar" ? "auto" : input.locale,
    "metadata[order]": input.orderNumber,
    "payment_intent_data[metadata][order]": input.orderNumber,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(input.amountMinor),
    "line_items[0][price_data][product_data][name]": input.description.slice(0, 250),
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
  if (!res.ok || !json.url) throw new Error(`Stripe: ${json.error?.message || res.status}`);
  return { id: json.id!, url: json.url };
}

/** Verifies the Stripe-Signature header (v1 scheme, 5-minute tolerance). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return signatures.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
