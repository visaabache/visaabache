import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";

export type StoreSettings = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  pinterest: string;
  legalName: string;
  ice: string;
};

export type ShippingSettings = {
  /** Free delivery inside Morocco from this subtotal (centimes). 0 disables. */
  freeThresholdMa: number;
  /** Fee for a Moroccan city that is not in the list (centimes). */
  otherCityFee: number;
  otherCityMinDays: number;
  otherCityMaxDays: number;
  /** Allow shipping to countries that are in no zone (on request). */
  internationalEnabled: boolean;
};

export type PaymentSettings = {
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  cmiEnabled: boolean;
  stripeEnabled: boolean;
  bankHolder: string;
  bankName: string;
  rib: string;
  iban: string;
  swift: string;
};

export type InventorySettings = { lowStockThreshold: number; alertEmail: string };

export type Settings = {
  store: StoreSettings;
  shipping: ShippingSettings;
  payments: PaymentSettings;
  inventory: InventorySettings;
};

export const DEFAULT_SETTINGS: Settings = {
  store: {
    name: "Dar Zellij",
    tagline: "Moroccan zellige-inspired ceramics",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    pinterest: "",
    legalName: "",
    ice: "",
  },
  shipping: { freeThresholdMa: 50000, otherCityFee: 4500, otherCityMinDays: 2, otherCityMaxDays: 5, internationalEnabled: true },
  payments: {
    codEnabled: true,
    bankTransferEnabled: true,
    cmiEnabled: true,
    stripeEnabled: true,
    bankHolder: "",
    bankName: "",
    rib: "",
    iban: "",
    swift: "",
  },
  inventory: { lowStockThreshold: 3, alertEmail: "" },
};

export type SettingsKey = keyof Settings;

async function load(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const out = structuredClone(DEFAULT_SETTINGS) as Settings;
  for (const r of rows) {
    const k = r.key as SettingsKey;
    if (k in out && r.value && typeof r.value === "object") Object.assign(out[k], r.value);
  }
  return out;
}

export const getSettings = unstable_cache(load, ["settings"], { tags: ["settings"], revalidate: 3600 });

/** Whether a payment provider has its credentials configured (and is switched on in settings). */
export function providerReady(method: "CMI" | "STRIPE", s: PaymentSettings) {
  if (method === "CMI") return s.cmiEnabled && !!process.env.CMI_CLIENT_ID && !!process.env.CMI_STORE_KEY;
  return s.stripeEnabled && !!process.env.STRIPE_SECRET_KEY;
}
