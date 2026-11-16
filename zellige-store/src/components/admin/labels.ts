import type { OrderStatus, PaymentStatus, ProductStatus } from "@prisma/client";

type Tone = "neutral" | "green" | "red" | "blue" | "yellow";

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  PENDING: "yellow", CONFIRMED: "blue", PROCESSING: "blue", SHIPPED: "blue", OUT_FOR_DELIVERY: "blue", DELIVERED: "green", CANCELLED: "red", RETURNED: "red",
};
export const PAY_TONE: Record<PaymentStatus, Tone> = { PENDING: "yellow", AWAITING_TRANSFER: "yellow", PAID: "green", FAILED: "red", REFUNDED: "neutral" };
export const PRODUCT_TONE: Record<ProductStatus, Tone> = { DRAFT: "yellow", PUBLISHED: "green", ARCHIVED: "neutral" };

export const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: "New", CONFIRMED: "Confirmed", PROCESSING: "Preparing", SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", RETURNED: "Returned",
};
export const PAY_LABEL: Record<PaymentStatus, string> = { PENDING: "Pending", AWAITING_TRANSFER: "Awaiting transfer", PAID: "Paid", FAILED: "Failed", REFUNDED: "Refunded" };
export const METHOD_LABEL = { COD: "Cash on delivery", BANK_TRANSFER: "Bank transfer", CMI: "Card (CMI)", STRIPE: "Card (Stripe)" } as const;
export const CRAFT_LABEL = {
  UNSPECIFIED: "Zellige-inspired design (no handmade claim)",
  ARTISAN_INSPIRED: "Artisan-inspired design (no handmade claim)",
  ARTISAN_MADE: "Made by artisans (needs a craft note)",
  HANDMADE_VERIFIED: "Handmade, verified (needs a craft note)",
} as const;

export const KNOWN_COLORS = ["blue", "green", "red", "yellow", "white", "black", "gold", "turquoise", "orange", "brown", "multicolor"];
export const KNOWN_PATTERNS = ["star-8", "rosette", "star-emblem", "mosaic", "arch", "medallion", "geometric", "i-love-morocco"];
