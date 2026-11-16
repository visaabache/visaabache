/**
 * Courier registry. Every carrier gives a public tracking-URL template. API-backed integrations
 * (shipment creation, label printing, status webhooks) plug in by implementing CourierProvider and
 * registering it in `providers`; until then shipments are created in the carrier's own portal and the
 * tracking number is typed into the order.
 */
export type Courier = { id: string; name: string; trackingUrl?: string; international?: boolean };

export const COURIERS: Courier[] = [
  { id: "amana", name: "Amana (Barid Al-Maghrib)", trackingUrl: "https://www.amana.ma/suivi-envoi?code={n}" },
  { id: "ctm", name: "CTM Messagerie" },
  { id: "sendit", name: "Sendit" },
  { id: "cathedis", name: "Cathedis" },
  { id: "own", name: "Own delivery / coursier" },
  { id: "aramex", name: "Aramex", trackingUrl: "https://www.aramex.com/track/results?ShipmentNumber={n}", international: true },
  { id: "dhl", name: "DHL Express", trackingUrl: "https://www.dhl.com/ma-en/home/tracking.html?tracking-id={n}", international: true },
  { id: "ems", name: "EMS / Poste Maroc international", trackingUrl: "https://www.17track.net/en/track?nums={n}", international: true },
];

export function trackingUrlFor(carrierId: string | null | undefined, number: string | null | undefined) {
  if (!carrierId || !number) return null;
  const c = COURIERS.find((x) => x.id === carrierId);
  return c?.trackingUrl ? c.trackingUrl.replace("{n}", encodeURIComponent(number)) : null;
}

export const courierName = (id: string | null | undefined) => COURIERS.find((c) => c.id === id)?.name ?? id ?? "";

export interface CourierProvider {
  id: string;
  createShipment(order: { number: string; name: string; phone: string; city: string; address: string; codAmountMad: number | null; weightG: number }): Promise<{ trackingNumber: string; labelUrl?: string }>;
  getStatus(trackingNumber: string): Promise<{ status: "in_transit" | "out_for_delivery" | "delivered" | "returned" | "unknown"; raw?: unknown }>;
}

/** Register API integrations here, e.g. `providers.sendit = new SenditProvider(process.env.SENDIT_KEY!)`. */
export const providers: Record<string, CourierProvider> = {};
