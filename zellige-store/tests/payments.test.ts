import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cmiHash, escapeCmi, verifyCmiHash } from "@/lib/payments/cmi";
import { verifyStripeSignature } from "@/lib/payments/stripe";

describe("CMI ver3 hash", () => {
  const params = { oid: "DZ-1", amount: "284.20", clientid: "600000", encoding: "UTF-8", BillToName: "Salma|B\\" };
  it("escapes separators and ignores encoding", () => {
    expect(escapeCmi("a|b\\c")).toBe("a\\|b\\\\c");
    expect(cmiHash(params, "KEY")).toBe(cmiHash({ ...params, encoding: "ISO" }, "KEY"));
  });
  it("verifies a correct HASH and rejects tampering", () => {
    const signed = { ...params, HASH: cmiHash(params, "KEY") };
    expect(verifyCmiHash(signed, "KEY")).toBe(true);
    expect(verifyCmiHash({ ...signed, amount: "1.00" }, "KEY")).toBe(false);
    expect(verifyCmiHash(signed, "OTHER")).toBe(false);
    expect(verifyCmiHash(params, "KEY")).toBe(false);
  });
});

describe("Stripe webhook signature", () => {
  const secret = "whsec_test";
  const body = '{"type":"checkout.session.completed"}';
  const sign = (t: number, b = body) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${b}`).digest("hex")}`;
  it("accepts a fresh valid signature", () => expect(verifyStripeSignature(body, sign(1000), secret, 1010)).toBe(true));
  it("rejects old, altered or missing signatures", () => {
    expect(verifyStripeSignature(body, sign(1000), secret, 2000)).toBe(false);
    expect(verifyStripeSignature(body + " ", sign(1000), secret, 1010)).toBe(false);
    expect(verifyStripeSignature(body, null, secret)).toBe(false);
  });
});
