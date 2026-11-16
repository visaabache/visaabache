import { createHash, timingSafeEqual } from "node:crypto";

/**
 * CMI (Centre Monétique Interbancaire) hosted payment page, "3D_PAY_HOSTING", hash "ver3".
 * The exact parameter list comes with the integration kit CMI sends after merchant onboarding:
 * validate on the CMI test platform (testpayment.cmi.co.ma) before going live.
 *
 * ver3 hash: sort parameter names case-insensitively (excluding "hash" and "encoding"), escape "\" and "|"
 * in values, join with "|", append "|" + escaped store key, SHA-512, base64.
 */
export const escapeCmi = (v: string) => v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

export function cmiHash(params: Record<string, string>, storeKey: string) {
  const keys = Object.keys(params)
    .filter((k) => !["hash", "encoding"].includes(k.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const plain = keys.map((k) => escapeCmi(String(params[k] ?? "").trim())).join("|") + "|" + escapeCmi(storeKey);
  return createHash("sha512").update(plain, "utf8").digest("base64");
}

export function verifyCmiHash(params: Record<string, string>, storeKey: string) {
  const received = params.HASH || params.hash;
  if (!received) return false;
  const rest = Object.fromEntries(Object.entries(params).filter(([k]) => k.toLowerCase() !== "hash"));
  const expected = Buffer.from(cmiHash(rest, storeKey));
  const got = Buffer.from(received);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export type CmiRequestInput = {
  orderNumber: string;
  amountMad: number;
  okUrl: string;
  failUrl: string;
  callbackUrl: string;
  shopUrl: string;
  lang: "fr" | "ar" | "en";
  email: string;
  name: string;
  phone?: string;
};

export function buildCmiRequest(input: CmiRequestInput) {
  const params: Record<string, string> = {
    clientid: process.env.CMI_CLIENT_ID || "",
    amount: input.amountMad.toFixed(2),
    okUrl: input.okUrl,
    failUrl: input.failUrl,
    TranType: "PreAuth",
    callbackUrl: input.callbackUrl,
    shopurl: input.shopUrl,
    currency: "504", // MAD, ISO 4217 numeric
    rnd: String(Date.now()),
    storetype: "3D_PAY_HOSTING",
    hashAlgorithm: "ver3",
    lang: input.lang,
    refreshtime: "5",
    BillToName: input.name.slice(0, 60),
    email: input.email,
    tel: input.phone || "",
    oid: input.orderNumber,
    encoding: "UTF-8",
  };
  params.HASH = cmiHash(params, process.env.CMI_STORE_KEY || "");
  return { url: process.env.CMI_GATEWAY_URL || "https://testpayment.cmi.co.ma/fim/est3Dgate", params };
}
