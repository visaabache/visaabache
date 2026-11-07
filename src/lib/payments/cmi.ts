import { createHash } from "node:crypto";

/**
 * CMI (Centre Monétique Interbancaire) hosted payment page — "3D_PAY_HOSTING", hash version "ver3".
 * The exact parameter list and confirmation protocol are defined in the integration kit your bank/CMI
 * provides after merchant onboarding — validate against it on the CMI test platform before going live.
 *
 * ver3 hash: sort parameter names case-insensitively (excluding "hash" and "encoding"), escape "\" and "|"
 * in values, join with "|", append "|" + escaped store key, SHA-512, base64.
 */
export function escapeCmi(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

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
  const { HASH: _h, hash: _h2, ...rest } = params;
  void _h;
  void _h2;
  return cmiHash(rest, storeKey) === received;
}

export type CmiRequestInput = {
  orderId: string;
  amount: number;
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
  const clientid = process.env.CMI_CLIENT_ID || "";
  const storeKey = process.env.CMI_STORE_KEY || "";
  const params: Record<string, string> = {
    clientid,
    amount: input.amount.toFixed(2),
    okUrl: input.okUrl,
    failUrl: input.failUrl,
    TranType: "PreAuth",
    callbackUrl: input.callbackUrl,
    shopurl: input.shopUrl,
    currency: "504", // MAD (ISO 4217 numeric)
    rnd: String(Date.now()),
    storetype: "3D_PAY_HOSTING",
    hashAlgorithm: "ver3",
    lang: input.lang,
    refreshtime: "5",
    BillToName: input.name.slice(0, 60),
    email: input.email,
    tel: input.phone || "",
    oid: input.orderId,
    encoding: "UTF-8",
    AutoRedirect: "true",
  };
  params.HASH = cmiHash(params, storeKey);
  return { url: process.env.CMI_GATEWAY_URL || "https://testpayment.cmi.co.ma/fim/est3Dgate", params };
}
