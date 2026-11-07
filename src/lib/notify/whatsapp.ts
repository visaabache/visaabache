import "server-only";
import { toWhatsAppNumber } from "../utils";

export function whatsappApiConfigured() {
  return Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Sends a WhatsApp message through the WhatsApp Business Cloud API.
 * Business-initiated messages outside the 24h customer service window require a Meta-approved template:
 * set WHATSAPP_TEMPLATE_NAME to a template with one body variable ({{1}}) and its language code in
 * WHATSAPP_TEMPLATE_LANG. Without a template, a plain text message is sent (only delivered inside the 24h window).
 */
export async function sendWhatsApp(phone: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!whatsappApiConfigured()) return { ok: false, error: "WhatsApp Cloud API not configured" };
  const to = toWhatsAppNumber(phone);
  if (!to) return { ok: false, error: "Invalid phone number" };
  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const body = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "fr" },
          components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 1000) }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: text.slice(0, 4000) } };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `WhatsApp ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
