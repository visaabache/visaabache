/** Pure pricing rules (no database): unit-tested in tests/pricing.test.ts. */

export type DiscountRule = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type DiscountCheck = { ok: true } | { ok: false; reason: "inactive" | "not_started" | "expired" | "used_up" | "min_subtotal" };

export function checkDiscount(rule: DiscountRule, subtotal: number, now = new Date()): DiscountCheck {
  if (!rule.isActive) return { ok: false, reason: "inactive" };
  if (rule.startsAt && rule.startsAt > now) return { ok: false, reason: "not_started" };
  if (rule.endsAt && rule.endsAt < now) return { ok: false, reason: "expired" };
  if (rule.maxUses !== null && rule.usedCount >= rule.maxUses) return { ok: false, reason: "used_up" };
  if (subtotal < rule.minSubtotal) return { ok: false, reason: "min_subtotal" };
  return { ok: true };
}

/** Amount taken off the subtotal (never more than the subtotal). */
export function discountAmount(rule: Pick<DiscountRule, "type" | "value">, subtotal: number) {
  if (rule.type === "PERCENT") return Math.min(subtotal, Math.round((subtotal * Math.min(100, Math.max(0, rule.value))) / 100));
  if (rule.type === "FIXED") return Math.min(subtotal, Math.max(0, rule.value));
  return 0;
}

export type ShippingOption = {
  fee: number;
  /** Free from this (discounted) subtotal; null = never free. */
  freeOver: number | null;
  minDays: number;
  maxDays: number;
  label: string;
};

export type Totals = { subtotal: number; discount: number; shipping: number; total: number; freeShipping: boolean };

export function computeTotals(subtotal: number, shipping: ShippingOption | null, rule: DiscountRule | null): Totals {
  const discount = rule ? discountAmount(rule, subtotal) : 0;
  const afterDiscount = subtotal - discount;
  let fee = shipping ? shipping.fee : 0;
  let freeShipping = false;
  if (shipping && ((shipping.freeOver !== null && shipping.freeOver > 0 && afterDiscount >= shipping.freeOver) || rule?.type === "FREE_SHIPPING")) {
    fee = 0;
    freeShipping = true;
  }
  return { subtotal, discount, shipping: fee, total: afterDiscount + fee, freeShipping };
}

/** International fee: base + per started kilogram. */
export function zoneFee(base: number, perKg: number, weightG: number) {
  return base + perKg * Math.max(0, Math.ceil(weightG / 1000) - 1);
}
