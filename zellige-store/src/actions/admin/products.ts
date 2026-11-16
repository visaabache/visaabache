"use server";

import { Prisma, type CraftType, type ProductStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { bool, float, i18nFrom, int, isEmptyI18n, list, money, str } from "@/lib/form";
import { deleteImage, storeImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const CRAFT: CraftType[] = ["UNSPECIFIED", "ARTISAN_INSPIRED", "ARTISAN_MADE", "HANDMADE_VERIFIED"];

const variantSchema = z.array(
  z.object({
    id: z.string().optional(),
    sku: z.string().trim().min(1).max(60),
    name: z.object({ fr: z.string().max(120).optional(), ar: z.string().max(120).optional(), en: z.string().max(120).optional() }),
    color: z.string().max(30).optional().nullable(),
    pattern: z.string().max(40).optional().nullable(),
    size: z.string().max(40).optional().nullable(),
    price: z.string().max(20).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(1_000_000),
    isActive: z.boolean(),
  }),
).max(60);

function done() {
  revalidateTag(CATALOG_TAG);
}

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base) || "product";
  for (let i = 2; ; i++) {
    const hit = await prisma.product.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    if (!hit) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

function readProduct(fd: FormData) {
  const name = i18nFrom(fd, "name", 200);
  const craftType = (CRAFT.includes(str(fd, "craftType") as CraftType) ? str(fd, "craftType") : "UNSPECIFIED") as CraftType;
  const craftNote = i18nFrom(fd, "craftNote", 3000);
  const status = (STATUSES.includes(str(fd, "status") as ProductStatus) ? str(fd, "status") : "DRAFT") as ProductStatus;
  const price = money(fd, "price");
  const compareAtPrice = money(fd, "compareAtPrice");
  const colors = [...fd.getAll("colors").map(String), ...list(str(fd, "colorsExtra"))];
  const patterns = [...fd.getAll("patterns").map(String), ...list(str(fd, "patternsExtra"))];
  return {
    name,
    status,
    craftType,
    craftNote,
    price,
    compareAtPrice,
    data: {
      name,
      shortDescription: i18nFrom(fd, "shortDescription", 600),
      description: i18nFrom(fd, "description"),
      materials: i18nFrom(fd, "materials", 3000),
      care: i18nFrom(fd, "care", 3000),
      craftType,
      craftNote,
      status,
      price: price ?? 0,
      compareAtPrice: compareAtPrice && price && compareAtPrice > price ? compareAtPrice : null,
      stock: Math.max(0, int(fd, "stock") ?? 0),
      lowStockThreshold: int(fd, "lowStockThreshold"),
      widthCm: float(fd, "widthCm"),
      heightCm: float(fd, "heightCm"),
      depthCm: float(fd, "depthCm"),
      diameterCm: float(fd, "diameterCm"),
      capacityMl: int(fd, "capacityMl"),
      weightG: int(fd, "weightG"),
      colors: [...new Set(colors.map((c) => c.toLowerCase().trim()).filter(Boolean))],
      patterns: [...new Set(patterns.map((c) => c.toLowerCase().trim()).filter(Boolean))],
      featured: bool(fd, "featured"),
      giftable: bool(fd, "giftable"),
      personalizable: bool(fd, "personalizable"),
      seoTitle: i18nFrom(fd, "seoTitle", 120),
      seoDescription: i18nFrom(fd, "seoDescription", 300),
    },
  };
}

function validate(p: ReturnType<typeof readProduct>, sku: string): string | null {
  if (!p.name.fr && !p.name.en && !p.name.ar) return "Enter the product name in at least one language.";
  if (!sku) return "SKU is required.";
  if (p.price === null || p.price <= 0) return "Enter a price greater than 0 (MAD).";
  if ((p.craftType === "ARTISAN_MADE" || p.craftType === "HANDMADE_VERIFIED") && isEmptyI18n(p.craftNote))
    return "For “Made by artisans” or “Handmade (verified)”, add a craft note saying who made it and how you verified it.";
  return null;
}

async function saveVariants(tx: Prisma.TransactionClient, productId: string, raw: string) {
  const parsed = variantSchema.safeParse(JSON.parse(raw || "[]"));
  if (!parsed.success) throw new Error("Variants: check every row has a SKU and a stock number.");
  const existing = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
  const keep = new Set(parsed.data.filter((v) => v.id).map((v) => v.id!));
  // Variants that were ordered are deactivated rather than deleted, to keep order history intact.
  for (const v of existing) {
    if (keep.has(v.id)) continue;
    const used = await tx.orderItem.count({ where: { variantId: v.id } });
    if (used) await tx.productVariant.update({ where: { id: v.id }, data: { isActive: false } });
    else await tx.productVariant.delete({ where: { id: v.id } });
  }
  for (const [i, v] of parsed.data.entries()) {
    const price = v.price ? Math.round(Number(String(v.price).replace(",", ".")) * 100) : null;
    const data = {
      sku: v.sku.toUpperCase(),
      name: v.name,
      color: v.color || null,
      pattern: v.pattern || null,
      size: v.size || null,
      price: price && price > 0 ? price : null,
      stock: v.stock,
      isActive: v.isActive,
      sortOrder: i,
    };
    if (v.id && existing.some((e) => e.id === v.id)) await tx.productVariant.update({ where: { id: v.id }, data });
    else await tx.productVariant.create({ data: { ...data, productId } });
  }
}

async function uploadImages(productId: string, files: File[], altName: Prisma.InputJsonValue) {
  const real = files.filter((f) => f && typeof f === "object" && f.size > 0).slice(0, 20);
  if (!real.length) return 0;
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  let order = (last?.sortOrder ?? -1) + 1;
  for (const f of real) {
    const img = await storeImage(f);
    await prisma.productImage.create({ data: { productId, url: img.url, width: img.width, height: img.height, sortOrder: order++, alt: altName } });
  }
  return real.length;
}

async function syncCollections(tx: Prisma.TransactionClient, productId: string, ids: string[]) {
  await tx.collectionProduct.deleteMany({ where: { productId, collectionId: { notIn: ids } } });
  for (const collectionId of ids) {
    await tx.collectionProduct.upsert({ where: { collectionId_productId: { collectionId, productId } }, create: { collectionId, productId }, update: {} });
  }
}

function friendly(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = String((e.meta as { target?: string[] })?.target ?? "");
    return target.includes("sku") ? "This SKU is already used by another product or variant." : "This slug is already used.";
  }
  return e instanceof Error ? e.message : "Save failed.";
}

export async function saveProduct(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const sku = str(fd, "sku", 60).toUpperCase();
  const p = readProduct(fd);
  const err = validate(p, sku);
  if (err) return { error: err };
  const categoryId = str(fd, "categoryId") || null;
  const collectionIds = fd.getAll("collections").map(String).filter(Boolean);
  try {
    const before = id ? await prisma.product.findUnique({ where: { id }, select: { status: true, publishedAt: true } }) : null;
    const slug = await uniqueSlug(str(fd, "slug") || p.name.fr || p.name.en || sku, id || undefined);
    const publishedAt = p.status === "PUBLISHED" ? before?.publishedAt ?? new Date() : before?.publishedAt ?? null;
    const product = await prisma.$transaction(async (tx) => {
      const row = id
        ? await tx.product.update({ where: { id }, data: { ...p.data, sku, slug, publishedAt, category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } } })
        : await tx.product.create({ data: { ...p.data, sku, slug, publishedAt, categoryId } });
      await saveVariants(tx, row.id, str(fd, "variants", 200_000));
      await syncCollections(tx, row.id, collectionIds);
      return row;
    });
    const uploaded = await uploadImages(product.id, fd.getAll("images") as File[], p.name as Prisma.InputJsonValue);
    await audit(admin.email, id ? "product.update" : "product.create", product.sku);
    done();
    if (!id) return { ok: true, redirect: `/admin/products/${product.id}?created=1` };
    return { ok: true, message: uploaded ? `Saved · ${uploaded} image(s) added` : before?.status !== p.status && p.status === "PUBLISHED" ? "Saved and published" : "Saved" };
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function addProductImages(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const productId = str(fd, "productId");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return { error: "Product not found" };
  try {
    const n = await uploadImages(productId, fd.getAll("images") as File[], product.name as Prisma.InputJsonValue);
    done();
    return n ? { ok: true, message: `${n} image(s) uploaded` } : { error: "Choose at least one image." };
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function updateProductImage(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const imageId = str(fd, "imageId");
  const op = str(fd, "op");
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return { error: "Image not found" };
  if (op === "delete") {
    await prisma.productImage.delete({ where: { id: imageId } });
    if (!(await prisma.productImage.count({ where: { url: img.url } }))) await deleteImage(img.url);
  } else if (op === "alt") {
    await prisma.productImage.update({ where: { id: imageId }, data: { alt: i18nFrom(fd, "alt", 200) } });
  } else if (op === "first" || op === "up" || op === "down") {
    const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
    const i = all.findIndex((x) => x.id === imageId);
    const target = op === "first" ? 0 : op === "up" ? Math.max(0, i - 1) : Math.min(all.length - 1, i + 1);
    const [moved] = all.splice(i, 1);
    all.splice(target, 0, moved);
    await prisma.$transaction(all.map((x, idx) => prisma.productImage.update({ where: { id: x.id }, data: { sortOrder: idx } })));
  }
  done();
  return { ok: true };
}

export async function setProductStatus(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as ProductStatus;
  if (!STATUSES.includes(status)) return { error: "Invalid status" };
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return { error: "Not found" };
  await prisma.product.update({ where: { id }, data: { status, publishedAt: status === "PUBLISHED" ? p.publishedAt ?? new Date() : p.publishedAt } });
  await audit(admin.email, `product.${status.toLowerCase()}`, p.sku);
  done();
  return { ok: true };
}

export async function toggleFeatured(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const p = await prisma.product.findUnique({ where: { id }, select: { featured: true } });
  if (!p) return { error: "Not found" };
  await prisma.product.update({ where: { id }, data: { featured: !p.featured } });
  done();
  return { ok: true };
}

export async function deleteProduct(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true, _count: { select: { orderItems: true } } } });
  if (!p) return { error: "Not found" };
  if (p._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    done();
    return { ok: true, message: "This product has orders, so it was archived instead of deleted." };
  }
  await prisma.product.delete({ where: { id } });
  for (const img of p.images) if (!(await prisma.productImage.count({ where: { url: img.url } }))) await deleteImage(img.url);
  await audit(admin.email, "product.delete", p.sku);
  done();
  return { ok: true, redirect: "/admin/products" };
}

export async function duplicateProduct(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true, variants: true, collections: true } });
  if (!p) return { error: "Not found" };
  let sku = `${p.sku}-COPY`;
  for (let i = 2; await prisma.product.findUnique({ where: { sku }, select: { id: true } }); i++) sku = `${p.sku}-COPY${i}`;
  const J = (v: Prisma.JsonValue | null) => (v ?? undefined) as Prisma.InputJsonValue | undefined;
  const stamp = Date.now().toString(36).toUpperCase();
  const copy = await prisma.product.create({
    data: {
      sku,
      slug: await uniqueSlug(`${p.slug}-copy`),
      status: "DRAFT",
      name: p.name as Prisma.InputJsonValue,
      shortDescription: J(p.shortDescription),
      description: J(p.description),
      materials: J(p.materials),
      care: J(p.care),
      craftType: p.craftType,
      craftNote: J(p.craftNote),
      seoTitle: J(p.seoTitle),
      seoDescription: J(p.seoDescription),
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: 0,
      lowStockThreshold: p.lowStockThreshold,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      depthCm: p.depthCm,
      diameterCm: p.diameterCm,
      capacityMl: p.capacityMl,
      weightG: p.weightG,
      colors: p.colors,
      patterns: p.patterns,
      giftable: p.giftable,
      personalizable: p.personalizable,
      category: p.categoryId ? { connect: { id: p.categoryId } } : undefined,
      images: { create: p.images.map((i) => ({ url: i.url, alt: J(i.alt), width: i.width, height: i.height, sortOrder: i.sortOrder })) },
      variants: { create: p.variants.map((v, i) => ({ sku: `${v.sku}-${stamp}${i}`, name: v.name as Prisma.InputJsonValue, color: v.color, pattern: v.pattern, size: v.size, price: v.price, stock: 0, isActive: v.isActive, sortOrder: v.sortOrder })) },
      collections: { create: p.collections.map((c) => ({ collectionId: c.collectionId })) },
    },
  });
  return { ok: true, redirect: `/admin/products/${copy.id}` };
}

export async function adjustStock(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(fd, "id");
  const stock = int(fd, "stock");
  if (stock === null || stock < 0) return { error: "Enter a stock of 0 or more." };
  await prisma.product.update({ where: { id }, data: { stock } });
  done();
  return { ok: true };
}
