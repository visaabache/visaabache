import { z } from "zod";
import { quoteCart } from "@/lib/cart";
import { asLocale } from "@/lib/i18n/config";
import { json, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  lines: z.array(z.object({ productId: z.string().max(40), variantId: z.string().max(40).nullish(), quantity: z.number().int().min(1).max(99) })).max(100),
  country: z.string().length(2).optional(),
  cityId: z.string().max(40).nullish(),
  code: z.string().max(40).nullish(),
  locale: z.string().optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  return json(await quoteCart(parsed.data, asLocale(parsed.data.locale)));
}
