import { describe, expect, it } from "vitest";
import { checkDiscount, computeTotals, discountAmount, zoneFee, type DiscountRule } from "@/lib/pricing";

const rule = (r: Partial<DiscountRule>): DiscountRule => ({ code: "X", type: "PERCENT", value: 10, minSubtotal: 0, maxUses: null, usedCount: 0, startsAt: null, endsAt: null, isActive: true, ...r });
const ship = { fee: 2500, freeOver: 50000, minDays: 1, maxDays: 2, label: "Casablanca" };

describe("discounts", () => {
  it("percent and fixed never exceed the subtotal", () => {
    expect(discountAmount(rule({ value: 10 }), 28800)).toBe(2880);
    expect(discountAmount(rule({ type: "FIXED", value: 50000 }), 28800)).toBe(28800);
    expect(discountAmount(rule({ value: 150 }), 1000)).toBe(1000);
  });
  it("validates dates, usage and minimum", () => {
    const now = new Date("2026-06-01");
    expect(checkDiscount(rule({ isActive: false }), 1000, now)).toEqual({ ok: false, reason: "inactive" });
    expect(checkDiscount(rule({ endsAt: new Date("2026-05-01") }), 1000, now)).toEqual({ ok: false, reason: "expired" });
    expect(checkDiscount(rule({ startsAt: new Date("2026-07-01") }), 1000, now)).toEqual({ ok: false, reason: "not_started" });
    expect(checkDiscount(rule({ maxUses: 3, usedCount: 3 }), 1000, now)).toEqual({ ok: false, reason: "used_up" });
    expect(checkDiscount(rule({ minSubtotal: 15000 }), 14999, now)).toEqual({ ok: false, reason: "min_subtotal" });
    expect(checkDiscount(rule({}), 1000, now)).toEqual({ ok: true });
  });
});

describe("totals", () => {
  it("matches the checkout tested end to end (288 DH, 10%, Casablanca)", () => {
    expect(computeTotals(28800, ship, rule({}))).toEqual({ subtotal: 28800, discount: 2880, shipping: 2500, total: 28420, freeShipping: false });
  });
  it("free delivery uses the discounted subtotal", () => {
    expect(computeTotals(52000, ship, rule({ value: 10 })).shipping).toBe(2500); // 468 DH after discount
    expect(computeTotals(56000, ship, rule({ value: 10 })).freeShipping).toBe(true); // 504 DH
  });
  it("free-shipping codes zero the fee only", () => {
    expect(computeTotals(10000, ship, rule({ type: "FREE_SHIPPING" }))).toMatchObject({ discount: 0, shipping: 0, total: 10000 });
  });
  it("international weight pricing charges per started extra kilogram", () => {
    expect(zoneFee(25000, 6000, 800)).toBe(25000);
    expect(zoneFee(25000, 6000, 1001)).toBe(31000);
    expect(zoneFee(25000, 6000, 3000)).toBe(37000);
  });
});
