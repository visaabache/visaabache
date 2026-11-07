import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { LocalizedText } from "./i18n/localized";

export type BusinessSettings = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  hours: LocalizedText;
  ice: string; // Identifiant Commun de l'Entreprise
  rc: string;
  ifNumber: string;
  patente: string;
  cndpDeclaration: string; // CNDP declaration/authorization number (Law 09-08)
  dpoEmail: string;
};

export type WhatsAppSettings = {
  number: string;
  enabled: boolean;
  defaultMessage: LocalizedText;
  notifyCustomers: boolean; // send automated WhatsApp notifications via Cloud API (if configured)
};

export type PaymentSettings = {
  cardEnabled: boolean;
  bankTransferEnabled: boolean;
  cashEnabled: boolean;
  bankName: string;
  bankBeneficiary: string;
  bankRib: string;
  bankSwift: string;
  bankInstructions: LocalizedText;
  invoicePrefix: string;
  invoiceDueDays: number;
  vatRate: number; // 0 if not subject to VAT
  invoiceFooter: LocalizedText;
};

export type NotificationSettings = {
  emailEnabled: boolean;
  adminEmail: string;
  notifyAdminOnNewApplication: boolean;
  notifyAdminOnNewInquiry: boolean;
  paymentReminderDays: number;
  missingDocsReminderDays: number;
  maxReminders: number;
};

export type RetentionSettings = {
  archiveCompletedAfterDays: number;
  deleteDocumentsAfterDays: number; // after completion / cancellation
  deleteDraftsAfterDays: number;
  anonymizeInactiveCustomersAfterDays: number; // 0 = disabled
};

export type SeoSettings = {
  siteTitle: LocalizedText;
  siteDescription: LocalizedText;
  keywords: LocalizedText;
  gaMeasurementId: string;
  googleSiteVerification: string;
  ogImageUrl: string;
  social: { facebook: string; instagram: string; tiktok: string; linkedin: string; youtube: string };
};

export type SettingsMap = {
  business: BusinessSettings;
  whatsapp: WhatsAppSettings;
  payments: PaymentSettings;
  notifications: NotificationSettings;
  retention: RetentionSettings;
  seo: SeoSettings;
};

export const DEFAULT_SETTINGS: SettingsMap = {
  business: {
    name: "VISA ABACHE",
    legalName: "VISA ABACHE",
    email: "contact@visaabache.ma",
    phone: "+212 6 00 00 00 00",
    address: "",
    city: "Casablanca",
    hours: { fr: "Lun–Sam : 9h00–19h00", ar: "الاثنين–السبت: 9:00–19:00", en: "Mon–Sat: 9:00–19:00" },
    ice: "",
    rc: "",
    ifNumber: "",
    patente: "",
    cndpDeclaration: "",
    dpoEmail: "privacy@visaabache.ma",
  },
  whatsapp: {
    number: "212600000000",
    enabled: true,
    defaultMessage: {
      fr: "Bonjour VISA ABACHE, je souhaite obtenir des informations.",
      ar: "السلام عليكم VISA ABACHE، أرغب في الحصول على معلومات.",
      en: "Hello VISA ABACHE, I would like some information.",
    },
    notifyCustomers: false,
  },
  payments: {
    cardEnabled: false,
    bankTransferEnabled: true,
    cashEnabled: true,
    bankName: "",
    bankBeneficiary: "VISA ABACHE",
    bankRib: "",
    bankSwift: "",
    bankInstructions: {
      fr: "Indiquez la référence de paiement dans le motif du virement, puis téléversez le justificatif.",
      ar: "يرجى ذكر مرجع الأداء في سبب التحويل ثم رفع وصل التحويل.",
      en: "Include the payment reference in the transfer description, then upload the receipt.",
    },
    invoicePrefix: "VA",
    invoiceDueDays: 7,
    vatRate: 0,
    invoiceFooter: {
      fr: "VISA ABACHE est un prestataire indépendant d'assistance. Les frais officiels (consulat, centre de visa) ne sont pas inclus.",
      ar: "VISA ABACHE مقدم خدمات مساعدة مستقل. الرسوم الرسمية (القنصلية، مركز التأشيرات) غير مشمولة.",
      en: "VISA ABACHE is an independent assistance provider. Official fees (consulate, visa centre) are not included.",
    },
  },
  notifications: {
    emailEnabled: true,
    adminEmail: "contact@visaabache.ma",
    notifyAdminOnNewApplication: true,
    notifyAdminOnNewInquiry: true,
    paymentReminderDays: 3,
    missingDocsReminderDays: 3,
    maxReminders: 3,
  },
  retention: {
    archiveCompletedAfterDays: 30,
    deleteDocumentsAfterDays: 90,
    deleteDraftsAfterDays: 30,
    anonymizeInactiveCustomersAfterDays: 0,
  },
  seo: {
    siteTitle: {
      fr: "VISA ABACHE — Assistance visa & services administratifs au Maroc",
      ar: "VISA ABACHE — خدمات المساعدة في التأشيرات والخدمات الإدارية بالمغرب",
      en: "VISA ABACHE — Visa assistance & administrative services in Morocco",
    },
    siteDescription: {
      fr: "Assistance dossier visa Maroc : France, Espagne, Italie, Schengen, Canada, USA. Préparation de dossier, check-list personnalisée, suivi en ligne. Prestataire indépendant.",
      ar: "خدمات التأشيرات في المغرب: مساعدة فيزا فرنسا، إسبانيا، إيطاليا، شنغن، كندا وأمريكا. تحضير الملف وقائمة وثائق مخصصة وتتبع الطلب عبر الإنترنت.",
      en: "Visa application assistance in Morocco for France, Spain, Italy, Schengen, Canada, USA and more. File preparation, personalised checklists and online tracking.",
    },
    keywords: {
      fr: "visa France Maroc, visa Espagne Maroc, visa Italie Maroc, visa Schengen Maroc, prendre rendez-vous visa, assistance dossier visa Maroc, visa Canada Maroc, visa USA Maroc, assistance administrative Maroc",
      ar: "خدمات التأشيرات في المغرب, مساعدة فيزا فرنسا, فيزا شنغن المغرب, فيزا إسبانيا, فيزا كندا",
      en: "visa Morocco, Schengen visa Morocco, France visa Morocco, Canada visa Morocco, USA visa Morocco",
    },
    gaMeasurementId: "",
    googleSiteVerification: "",
    ogImageUrl: "",
    social: { facebook: "", instagram: "", tiktok: "", linkedin: "", youtube: "" },
  },
};

export type SettingKey = keyof SettingsMap;

function merge<T>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored as Record<string, unknown>)) {
    const d = (defaults as Record<string, unknown>)[k];
    out[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" ? merge(d, v) : v;
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<SettingsMap> => {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    business: merge(DEFAULT_SETTINGS.business, map.business),
    whatsapp: merge(DEFAULT_SETTINGS.whatsapp, map.whatsapp),
    payments: merge(DEFAULT_SETTINGS.payments, map.payments),
    notifications: merge(DEFAULT_SETTINGS.notifications, map.notifications),
    retention: merge(DEFAULT_SETTINGS.retention, map.retention),
    seo: merge(DEFAULT_SETTINGS.seo, map.seo),
  };
});

export async function saveSetting<K extends SettingKey>(key: K, value: SettingsMap[K]) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value as unknown as Prisma.InputJsonValue },
    update: { value: value as unknown as Prisma.InputJsonValue },
  });
}

export function cmiConfigured() {
  return Boolean(process.env.CMI_CLIENT_ID && process.env.CMI_STORE_KEY);
}
