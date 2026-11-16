import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { exportRows, PRODUCT_COLUMNS, toXlsx, VARIANT_COLUMNS } from "@/lib/product-sheet";

export const runtime = "nodejs";

const file = (body: BodyInit, name: string, type: string) =>
  new Response(body, { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const url = new URL(req.url);
  const what = url.searchParams.get("what") || "products";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const day = new Date().toISOString().slice(0, 10);

  if (what === "template") {
    const example = ["ZM-001", "DRAFT", "", "zellige-mugs", "Mug zellige bleu", "كوب زليج أزرق", "Blue zellige mug", "", "", "", "", "", "", "Céramique", "", "Ceramic", "149", "", "12", "", "blue, white", "star-8", "UNSPECIFIED", "", "10", "", "8", "350", "400", "no", "yes", ""];
    const buf = await toXlsx([
      { name: "products", header: PRODUCT_COLUMNS, rows: [example] },
      { name: "variants", header: VARIANT_COLUMNS, rows: [["ZM-001", "ZM-001-BLU", "Bleu", "أزرق", "Blue", "blue", "star-8", "", "", "6", "yes"]] },
    ]);
    return file(new Uint8Array(buf), "products-template.xlsx", XLSX);
  }

  if (what === "products") {
    const { productRows, variantRows } = await exportRows();
    if (format === "csv") return file(toCsv([...PRODUCT_COLUMNS], productRows), `products-${day}.csv`, "text/csv; charset=utf-8");
    const buf = await toXlsx([{ name: "products", header: PRODUCT_COLUMNS, rows: productRows }, { name: "variants", header: VARIANT_COLUMNS, rows: variantRows }]);
    return file(new Uint8Array(buf), `products-${day}.xlsx`, XLSX);
  }

  if (what === "inventory") {
    const rows = await prisma.product.findMany({ orderBy: { stock: "asc" }, include: { variants: true } });
    const header = ["sku", "name", "status", "variant_sku", "variant", "stock", "price_mad"];
    const data = rows.flatMap((p) => {
      const n = (p.name as Record<string, string>).fr || (p.name as Record<string, string>).en || "";
      return p.variants.length
        ? p.variants.map((v) => [p.sku, n, p.status, v.sku, (v.name as Record<string, string>).fr || "", v.stock, ((v.price ?? p.price) / 100).toFixed(2)])
        : [[p.sku, n, p.status, "", "", p.stock, (p.price / 100).toFixed(2)]];
    });
    if (format === "csv") return file(toCsv(header, data), `inventory-${day}.csv`, "text/csv; charset=utf-8");
    return file(new Uint8Array(await toXlsx([{ name: "inventory", header, rows: data }])), `inventory-${day}.xlsx`, XLSX);
  }

  if (what === "orders") {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 20000, include: { items: true } });
    const header = ["number", "date", "status", "payment_method", "payment_status", "first_name", "last_name", "email", "phone", "country", "city", "address", "items", "subtotal_mad", "discount_mad", "shipping_mad", "total_mad", "discount_code", "carrier", "tracking"];
    const data = orders.map((o) => [o.number, o.createdAt.toISOString(), o.status, o.paymentMethod, o.paymentStatus, o.firstName, o.lastName, o.email, o.phone, o.country, o.city, o.address, o.items.map((i) => `${i.sku}×${i.quantity}`).join(" "), (o.subtotal / 100).toFixed(2), (o.discountTotal / 100).toFixed(2), (o.shippingFee / 100).toFixed(2), (o.total / 100).toFixed(2), o.discountCode ?? "", o.carrier ?? "", o.trackingNumber ?? ""]);
    if (format === "csv") return file(toCsv(header, data), `orders-${day}.csv`, "text/csv; charset=utf-8");
    return file(new Uint8Array(await toXlsx([{ name: "orders", header, rows: data }])), `orders-${day}.xlsx`, XLSX);
  }

  if (what === "newsletter") {
    const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    return file(toCsv(["email", "locale", "subscribed_at"], subs.map((s) => [s.email, s.locale, s.createdAt.toISOString()])), `newsletter-${day}.csv`, "text/csv; charset=utf-8");
  }

  return new Response("Unknown export", { status: 400 });
}
