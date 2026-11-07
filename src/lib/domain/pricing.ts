import { round2 } from "../utils";

export type DiscountLike = {
  type: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  minAmount: number | null;
  packageSlugs: string[];
  validFrom: Date | null;
  validUntil: Date | null;
};

export type DiscountCheck = { ok: true; amount: number } | { ok: false; reason: "inactive" | "expired" | "exhausted" | "min_amount" | "not_applicable" };

export function evaluateDiscount(d: DiscountLike, subtotal: number, packageSlug: string | null, now = new Date()): DiscountCheck {
  if (!d.isActive) return { ok: false, reason: "inactive" };
  if ((d.validFrom && now < d.validFrom) || (d.validUntil && now > d.validUntil)) return { ok: false, reason: "expired" };
  if (d.maxUses != null && d.usedCount >= d.maxUses) return { ok: false, reason: "exhausted" };
  if (d.minAmount != null && subtotal < d.minAmount) return { ok: false, reason: "min_amount" };
  if (d.packageSlugs.length && (!packageSlug || !d.packageSlugs.includes(packageSlug))) return { ok: false, reason: "not_applicable" };
  const raw = d.type === "PERCENT" ? (subtotal * Math.min(d.value, 100)) / 100 : d.value;
  return { ok: true, amount: round2(Math.min(raw, subtotal)) };
}

export function invoiceTotals(items: { quantity: number; unitPrice: number }[], discount: number, vatRate: number) {
  const subtotal = round2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const afterDiscount = round2(Math.max(0, subtotal - discount));
  const vat = round2((afterDiscount * vatRate) / 100);
  return { subtotal, discount: round2(Math.min(discount, subtotal)), vat, total: round2(afterDiscount + vat) };
}
