import "server-only";
import ExcelJS from "exceljs";
import type { CraftType, Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "./db";
import { parseCsv, rowsToObjects } from "./csv";
import { parseMoney } from "./money";
import { slugify } from "./utils";

/** Spreadsheet columns, in order. Product names and descriptions have one column per language. */
export const PRODUCT_COLUMNS = [
  "sku", "status", "slug", "category",
  "name_fr", "name_ar", "name_en",
  "short_fr", "short_ar", "short_en",
  "description_fr", "description_ar", "description_en",
  "materials_fr", "materials_ar", "materials_en",
  "price_mad", "compare_at_price_mad", "stock", "low_stock_threshold",
  "colors", "patterns", "craft_type",
  "width_cm", "height_cm", "depth_cm", "diameter_cm", "capacity_ml", "weight_g",
  "featured", "giftable", "images",
] as const;

export const VARIANT_COLUMNS = ["product_sku", "variant_sku", "name_fr", "name_ar", "name_en", "color", "pattern", "size", "price_mad", "stock", "active"] as const;

const I18N = (r: Record<string, string>, base: string) => {
  const o: Record<string, string> = {};
  for (const l of ["fr", "ar", "en"]) if (r[`${base}_${l}`]) o[l] = r[`${base}_${l}`];
  return o;
};
const yes = (v?: string) => /^(1|yes|oui|true|x|نعم)$/i.test((v || "").trim());
const numOrNull = (v?: string) => {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const splitList = (v?: string) => [...new Set((v || "").split(/[,;|]/).map((x) => x.trim().toLowerCase()).filter(Boolean))];

export async function readSheet(file: File): Promise<{ products: Record<string, string>[]; variants: Record<string, string>[] }> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") return { products: rowsToObjects(parseCsv(buf.toString("utf8"))), variants: [] };
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const toRows = (ws?: ExcelJS.Worksheet) => {
    if (!ws) return [];
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) vals.push(row.getCell(c).text ?? "");
      rows.push(vals);
    });
    return rowsToObjects(rows);
  };
  return { products: toRows(wb.getWorksheet("products") ?? wb.worksheets[0]), variants: toRows(wb.getWorksheet("variants")) };
}

export type ImportReport = { created: number; updated: number; variants: number; errors: { row: number; sku: string; message: string }[] };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const CRAFT = ["UNSPECIFIED", "ARTISAN_INSPIRED", "ARTISAN_MADE", "HANDMADE_VERIFIED"];

/** Creates or updates products by SKU. Empty cells leave existing values untouched on update. */
export async function importProducts(sheet: Awaited<ReturnType<typeof readSheet>>, opts: { publish: boolean }): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, variants: 0, errors: [] };
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const [i, r] of sheet.products.slice(0, 5000).entries()) {
    const rowNo = i + 2;
    const sku = (r.sku || "").toUpperCase();
    try {
      if (!sku) throw new Error("Missing SKU");
      const existing = await prisma.product.findUnique({ where: { sku } });
      const name = I18N(r, "name");
      const price = parseMoney(r.price_mad);
      if (!existing && !Object.keys(name).length) throw new Error("Missing name (name_fr, name_ar or name_en)");
      if (!existing && (price === null || price <= 0)) throw new Error("Missing or invalid price_mad");
      const status = (STATUSES.includes((r.status || "").toUpperCase()) ? r.status.toUpperCase() : existing ? existing.status : opts.publish ? "PUBLISHED" : "DRAFT") as ProductStatus;
      const craft = CRAFT.includes((r.craft_type || "").toUpperCase()) ? (r.craft_type.toUpperCase() as CraftType) : undefined;
      if (craft === "ARTISAN_MADE" || craft === "HANDMADE_VERIFIED") throw new Error("craft_type ARTISAN_MADE / HANDMADE_VERIFIED needs a craft note: set it in the product form");
      const categoryId = r.category ? catBySlug.get(slugify(r.category)) ?? null : undefined;
      if (r.category && !categoryId) throw new Error(`Unknown category "${r.category}" (use the category slug)`);
      const compare = parseMoney(r.compare_at_price_mad);
      const data: Prisma.ProductUncheckedUpdateInput = {
        status,
        ...(Object.keys(name).length ? { name: { ...((existing?.name as object) || {}), ...name } } : {}),
        ...(Object.keys(I18N(r, "short")).length ? { shortDescription: { ...((existing?.shortDescription as object) || {}), ...I18N(r, "short") } } : {}),
        ...(Object.keys(I18N(r, "description")).length ? { description: { ...((existing?.description as object) || {}), ...I18N(r, "description") } } : {}),
        ...(Object.keys(I18N(r, "materials")).length ? { materials: { ...((existing?.materials as object) || {}), ...I18N(r, "materials") } } : {}),
        ...(price !== null ? { price } : {}),
        ...(r.compare_at_price_mad !== undefined && r.compare_at_price_mad !== "" ? { compareAtPrice: compare } : {}),
        ...(r.stock ? { stock: Math.max(0, Math.round(Number(r.stock)) || 0) } : {}),
        ...(r.low_stock_threshold ? { lowStockThreshold: Math.round(Number(r.low_stock_threshold)) || null } : {}),
        ...(r.colors ? { colors: splitList(r.colors) } : {}),
        ...(r.patterns ? { patterns: splitList(r.patterns) } : {}),
        ...(craft ? { craftType: craft } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(r.width_cm ? { widthCm: numOrNull(r.width_cm) } : {}),
        ...(r.height_cm ? { heightCm: numOrNull(r.height_cm) } : {}),
        ...(r.depth_cm ? { depthCm: numOrNull(r.depth_cm) } : {}),
        ...(r.diameter_cm ? { diameterCm: numOrNull(r.diameter_cm) } : {}),
        ...(r.capacity_ml ? { capacityMl: Math.round(numOrNull(r.capacity_ml) ?? 0) || null } : {}),
        ...(r.weight_g ? { weightG: Math.round(numOrNull(r.weight_g) ?? 0) || null } : {}),
        ...(r.featured ? { featured: yes(r.featured) } : {}),
        ...(r.giftable ? { giftable: yes(r.giftable) } : {}),
        ...(status === "PUBLISHED" && !existing?.publishedAt ? { publishedAt: new Date() } : {}),
      };
      const images = (r.images || "").split(/[\s,|]+/).filter((u) => /^(https:\/\/|\/)/.test(u)).slice(0, 20);
      let productId: string;
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        productId = existing.id;
        report.updated++;
      } else {
        let slug = slugify(r.slug || name.fr || name.en || sku) || slugify(sku);
        for (let n = 2; await prisma.product.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${slugify(r.slug || name.fr || name.en || sku)}-${n}`;
        const created = await prisma.product.create({ data: { ...(data as Prisma.ProductUncheckedCreateInput), sku, slug, name, price: price! } });
        productId = created.id;
        report.created++;
      }
      if (images.length) {
        const have = new Set((await prisma.productImage.findMany({ where: { productId }, select: { url: true } })).map((x) => x.url));
        const base = await prisma.productImage.count({ where: { productId } });
        const fresh = images.filter((u) => !have.has(u));
        if (fresh.length) await prisma.productImage.createMany({ data: fresh.map((url, k) => ({ productId, url, sortOrder: base + k, alt: name })) });
      }
    } catch (e) {
      report.errors.push({ row: rowNo, sku, message: e instanceof Error ? e.message.split("\n").pop()!.slice(0, 200) : "Error" });
    }
  }

  for (const [i, r] of sheet.variants.slice(0, 10000).entries()) {
    const sku = (r.variant_sku || "").toUpperCase();
    try {
      const product = await prisma.product.findUnique({ where: { sku: (r.product_sku || "").toUpperCase() }, select: { id: true } });
      if (!product) throw new Error(`Unknown product_sku "${r.product_sku}"`);
      if (!sku) throw new Error("Missing variant_sku");
      const name = I18N(r, "name");
      if (!Object.keys(name).length) throw new Error("Missing variant name");
      const price = parseMoney(r.price_mad);
      const data = { name, color: r.color || null, pattern: r.pattern || null, size: r.size || null, price: price && price > 0 ? price : null, stock: Math.max(0, Math.round(Number(r.stock)) || 0), isActive: r.active ? yes(r.active) : true };
      await prisma.productVariant.upsert({ where: { sku }, create: { ...data, sku, productId: product.id }, update: data });
      report.variants++;
    } catch (e) {
      report.errors.push({ row: i + 2, sku: `variants:${sku}`, message: e instanceof Error ? e.message.slice(0, 200) : "Error" });
    }
  }
  return report;
}

export async function exportRows() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" }, include: { category: true, images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } } });
  const t = (v: unknown, l: string) => ((v as Record<string, string> | null)?.[l] ?? "");
  const money = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));
  const productRows = products.map((p) => [
    p.sku, p.status, p.slug, p.category?.slug ?? "",
    t(p.name, "fr"), t(p.name, "ar"), t(p.name, "en"),
    t(p.shortDescription, "fr"), t(p.shortDescription, "ar"), t(p.shortDescription, "en"),
    t(p.description, "fr"), t(p.description, "ar"), t(p.description, "en"),
    t(p.materials, "fr"), t(p.materials, "ar"), t(p.materials, "en"),
    money(p.price), money(p.compareAtPrice), p.stock, p.lowStockThreshold ?? "",
    p.colors.join(", "), p.patterns.join(", "), p.craftType,
    p.widthCm ?? "", p.heightCm ?? "", p.depthCm ?? "", p.diameterCm ?? "", p.capacityMl ?? "", p.weightG ?? "",
    p.featured ? "yes" : "no", p.giftable ? "yes" : "no", p.images.map((i) => i.url).join(" "),
  ]);
  const variantRows = products.flatMap((p) => p.variants.map((v) => [p.sku, v.sku, t(v.name, "fr"), t(v.name, "ar"), t(v.name, "en"), v.color ?? "", v.pattern ?? "", v.size ?? "", money(v.price), v.stock, v.isActive ? "yes" : "no"]));
  return { productRows, variantRows };
}

export async function toXlsx(sheets: { name: string; header: readonly string[]; rows: unknown[][] }[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dar Zellij admin";
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.addRow([...s.header]);
    ws.getRow(1).font = { bold: true };
    // Strings that look like formulas are stored as plain text.
    for (const r of s.rows) ws.addRow(r.map((v) => (typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : v)));
    ws.columns.forEach((c) => (c.width = 18));
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
