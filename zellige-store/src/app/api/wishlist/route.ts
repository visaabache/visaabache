import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { json, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({ merge: z.array(z.string().max(40)).max(200).optional(), add: z.string().max(40).optional(), remove: z.string().max(40).optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "auth" }, 401);
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "invalid" }, 400);
  const ids = [...(body.data.merge || []), ...(body.data.add ? [body.data.add] : [])];
  if (ids.length) {
    const valid = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await prisma.wishlistItem.createMany({ data: valid.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
  }
  if (body.data.remove) await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId: body.data.remove } });
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  return json({ ids: items.map((i) => i.productId) });
}
