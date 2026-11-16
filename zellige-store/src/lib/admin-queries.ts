import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";

/** Products (or variants) at or under their low-stock threshold. */
export async function lowStockItems(limit = 50) {
  const { inventory } = await getSettings();
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, sku: true, name: true, stock: true, lowStockThreshold: true, status: true, variants: { where: { isActive: true }, select: { sku: true, name: true, stock: true } } },
  });
  const out: { productId: string; sku: string; name: unknown; variant: unknown; stock: number; threshold: number }[] = [];
  for (const p of products) {
    const threshold = p.lowStockThreshold ?? inventory.lowStockThreshold;
    if (p.variants.length) for (const v of p.variants) { if (v.stock <= threshold) out.push({ productId: p.id, sku: v.sku, name: p.name, variant: v.name, stock: v.stock, threshold }); }
    else if (p.stock <= threshold) out.push({ productId: p.id, sku: p.sku, name: p.name, variant: null, stock: p.stock, threshold });
  }
  return out.sort((a, b) => a.stock - b.stock).slice(0, limit);
}

export async function navCounts() {
  const [orders, reviews, low] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    lowStockItems(500),
  ]);
  return { orders, reviews, lowStock: low.length };
}
