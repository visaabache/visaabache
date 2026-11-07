import { describe, expect, it } from "vitest";
import { buildChecklist, matchesCondition } from "@/lib/domain/checklist";
import { evaluateDiscount, invoiceTotals } from "@/lib/domain/pricing";
import { applicationReference, isValidReference, paymentReference } from "@/lib/domain/references";

const item = (id: string, extra: Partial<Parameters<typeof buildChecklist>[0][number]> = {}) => ({
  id, title: { fr: id }, description: null, required: true, visaTypeCodes: [] as string[], condition: null as unknown, isActive: true, sortOrder: 0, ...extra,
});

describe("checklist generation", () => {
  it("filters by visa type and wizard answers", () => {
    const items = [
      item("passport", { sortOrder: 1 }),
      item("work-cert", { sortOrder: 2, condition: { question: "employment", op: "eq", value: "employed" } }),
      item("rc", { sortOrder: 3, condition: { question: "employment", op: "eq", value: "self_employed" } }),
      item("admission", { sortOrder: 4, visaTypeCodes: ["student"] }),
      item("inactive", { isActive: false }),
      item("minors", { condition: { question: "minors", op: "eq", value: "yes" } }),
    ];
    const ids = buildChecklist(items, "tourism", { employment: "employed", minors: "no" }).map((i) => i.id);
    expect(ids).toEqual(["passport", "work-cert"]);
    const student = buildChecklist(items, "student", { employment: "student", minors: "yes" }).map((i) => i.id);
    expect(student).toContain("admission");
    expect(student).toContain("minors");
    expect(student).not.toContain("work-cert");
  });

  it("supports in / neq / truthy operators", () => {
    expect(matchesCondition({ question: "x", op: "in", value: ["a", "b"] }, { x: "b" })).toBe(true);
    expect(matchesCondition({ question: "x", op: "neq", value: "a" }, { x: "a" })).toBe(false);
    expect(matchesCondition({ question: "x", op: "truthy" }, { x: "no" })).toBe(false);
    expect(matchesCondition({ question: "x", op: "truthy" }, { x: "yes" })).toBe(true);
    expect(matchesCondition(null, {})).toBe(true);
  });
});

describe("discounts & invoices", () => {
  const base = { isActive: true, maxUses: null, usedCount: 0, minAmount: null, packageSlugs: [] as string[], validFrom: null, validUntil: null };
  it("computes percent and fixed discounts, capped at subtotal", () => {
    expect(evaluateDiscount({ ...base, type: "PERCENT", value: 10 }, 750, "std")).toEqual({ ok: true, amount: 75 });
    expect(evaluateDiscount({ ...base, type: "FIXED", value: 1000 }, 750, "std")).toEqual({ ok: true, amount: 750 });
  });
  it("rejects expired, exhausted, inapplicable codes", () => {
    expect(evaluateDiscount({ ...base, type: "FIXED", value: 50, validUntil: new Date(Date.now() - 1000) }, 750, "std").ok).toBe(false);
    expect(evaluateDiscount({ ...base, type: "FIXED", value: 50, maxUses: 2, usedCount: 2 }, 750, "std").ok).toBe(false);
    expect(evaluateDiscount({ ...base, type: "FIXED", value: 50, packageSlugs: ["premium"] }, 750, "std").ok).toBe(false);
    expect(evaluateDiscount({ ...base, type: "FIXED", value: 50, minAmount: 1000 }, 750, "std").ok).toBe(false);
    expect(evaluateDiscount({ ...base, isActive: false, type: "FIXED", value: 50 }, 750, "std").ok).toBe(false);
  });
  it("computes invoice totals with VAT", () => {
    expect(invoiceTotals([{ quantity: 2, unitPrice: 100 }], 20, 20)).toEqual({ subtotal: 200, discount: 20, vat: 36, total: 216 });
    expect(invoiceTotals([{ quantity: 1, unitPrice: 750 }], 0, 0).total).toBe(750);
  });
});

describe("references", () => {
  it("generates valid, unambiguous references", () => {
    for (let i = 0; i < 200; i++) {
      const r = applicationReference(new Date("2026-11-06"));
      expect(isValidReference(r)).toBe(true);
      expect(r).toMatch(/^VA-26-/);
      expect(r.slice(6)).not.toMatch(/[01OIL]/);
    }
    expect(paymentReference()).toMatch(/^PAY-\d{2}-[A-Z2-9]{8}$/);
  });
});
