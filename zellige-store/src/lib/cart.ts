import "server-only";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "./db";
import { tr, type I18nText, type Locale } from "./i18n/config";
import { computeTotals, checkDiscount, zoneFee, type DiscountRule, type ShippingOption, type Totals } from "./pricing";
import { getSettings, providerReady } from "./settings";

export type CartLineInput = { productId: string; variantId?: string | null; quantity: number };

export type QuoteInput = {
  lines: CartLineInput[];
  country?: string;
  /** ShippingCity id, or "other" for a Moroccan city outside the list. */
  cityId?: string | null;
  code?: string | null;
};

export type PricedLine = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  sku: string;
  name: I18nText;
  variantName: I18nText | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  requested: number;
  maxQuantity: number;
  lineTotal: number;
  weightG: number;
  status: "ok" | "adjusted" | "unavailable";
};

export type Quote = {
  lines: PricedLine[];
  totals: Totals;
  shipping: (ShippingOption & { available: true }) | { available: false } | null;
  discount: { code: string; ok: boolean; reason?: string; type?: DiscountRule["type"] } | null;
  paymentMethods: PaymentMethod[];
  freeThresholdMa: number;
  itemCount: number;
};

export const lineKey = (productId: string, variantId?: string | null) => `${productId}:${variantId || ""}`;

export async function quoteCart(input: QuoteInput, locale: Locale = "fr"): Promise<Quote> {
  const settings = await getSettings();
  const merged = new Map<string, CartLineInput>();
  for (const l of input.lines.slice(0, 100)) {
    const q = Math.floor(Number(l.quantity));
    if (!l.productId || !Number.isFinite(q) || q <= 0) continue;
    const k = lineKey(l.productId, l.variantId);
    const prev = merged.get(k);
    merged.set(k, { productId: l.productId, variantId: l.variantId || null, quantity: Math.min(99, (prev?.quantity || 0) + q) });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set([...merged.values()].map((l) => l.productId))] } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  for (const [key, l] of merged) {
    const p = byId.get(l.productId);
    if (!p) continue;
    const variant = l.variantId ? p.variants.find((v) => v.id === l.variantId && v.isActive) : null;
    const needsVariant = p.variants.some((v) => v.isActive);
    const usable = p.status === "PUBLISHED" && (!needsVariant || !!variant) && (!l.variantId || !!variant);
    const stock = Math.max(0, variant ? variant.stock : p.stock);
    const quantity = usable ? Math.min(l.quantity, stock) : 0;
    const unitPrice = variant?.price ?? p.price;
    lines.push({
      key,
      productId: p.id,
      variantId: variant?.id ?? null,
      slug: p.slug,
      sku: variant?.sku ?? p.sku,
      name: p.name as I18nText,
      variantName: (variant?.name as I18nText) ?? null,
      image: p.images[0]?.url ?? null,
      unitPrice,
      compareAtPrice: p.compareAtPrice && p.compareAtPrice > unitPrice ? p.compareAtPrice : null,
      quantity,
      requested: l.quantity,
      maxQuantity: usable ? stock : 0,
      lineTotal: unitPrice * quantity,
      weightG: p.weightG ?? 500,
      status: quantity === 0 ? "unavailable" : quantity < l.quantity ? "adjusted" : "ok",
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const weightG = lines.reduce((s, l) => s + l.weightG * l.quantity, 0);

  // Discount code
  let rule: DiscountRule | null = null;
  let discount: Quote["discount"] = null;
  const code = input.code?.trim().toUpperCase();
  if (code) {
    const d = await prisma.discountCode.findUnique({ where: { code } });
    if (!d) discount = { code, ok: false, reason: "not_found" };
    else {
      const check = checkDiscount(d, subtotal);
      discount = check.ok ? { code, ok: true, type: d.type } : { code, ok: false, reason: check.reason };
      if (check.ok) rule = d;
    }
  }

  // Delivery
  const country = (input.country || "MA").toUpperCase();
  let shipping: Quote["shipping"] = null;
  let codAllowed = false;
  if (country === "MA") {
    if (input.cityId === "other") {
      shipping = { available: true, fee: settings.shipping.otherCityFee, freeOver: settings.shipping.freeThresholdMa || null, minDays: settings.shipping.otherCityMinDays, maxDays: settings.shipping.otherCityMaxDays, label: "" };
      codAllowed = true;
    } else if (input.cityId) {
      const city = await prisma.shippingCity.findFirst({ where: { id: input.cityId, isActive: true } });
      if (city) {
        shipping = { available: true, fee: city.fee, freeOver: settings.shipping.freeThresholdMa || null, minDays: city.minDays, maxDays: city.maxDays, label: tr(city.name, locale) };
        codAllowed = city.codAvailable;
      }
    } else codAllowed = true;
  } else {
    const zone = await prisma.shippingZone.findFirst({ where: { isActive: true, countries: { has: country } }, orderBy: { sortOrder: "asc" } });
    shipping = zone
      ? { available: true, fee: zoneFee(zone.fee, zone.perKgFee, weightG), freeOver: zone.freeOver, minDays: zone.minDays, maxDays: zone.maxDays, label: tr(zone.name, locale) }
      : { available: false };
  }

  const totals = computeTotals(subtotal, shipping && shipping.available ? shipping : null, rule);

  const p = settings.payments;
  const methods: PaymentMethod[] = [];
  if (country === "MA" && p.codEnabled && codAllowed) methods.push("COD");
  if (providerReady("CMI", p)) methods.push("CMI");
  if (country !== "MA" && providerReady("STRIPE", p)) methods.push("STRIPE");
  if (p.bankTransferEnabled && (p.rib || p.iban)) methods.push("BANK_TRANSFER");

  return {
    lines,
    totals,
    shipping,
    discount,
    paymentMethods: methods,
    freeThresholdMa: settings.shipping.freeThresholdMa,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

/** Countries offered at checkout: Morocco plus every country covered by an active zone. */
export async function shippingCountries() {
  const zones = await prisma.shippingZone.findMany({ where: { isActive: true }, select: { countries: true } });
  return ["MA", ...new Set(zones.flatMap((z) => z.countries).filter((c) => c !== "MA"))];
}

export function countryName(code: string, locale: Locale) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
