"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { bool, dateOrNull, i18nFrom, int, isEmptyI18n, str } from "@/lib/form";
import { storeImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";

const done = () => revalidateTag(CATALOG_TAG);

async function maybeImage(fd: FormData, folder: string) {
  const f = fd.get("image");
  if (f && typeof f === "object" && (f as File).size > 0) return (await storeImage(f as File, folder)).url;
  return undefined;
}

export async function saveCategory(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const name = i18nFrom(fd, "name", 120);
  if (isEmptyI18n(name)) return { error: "Enter a name." };
  const slug = slugify(str(fd, "slug") || name.fr || name.en || "");
  if (!slug) return { error: "Enter a slug (latin letters)." };
  const parentId = str(fd, "parentId") || null;
  if (id && parentId) {
    // Refuse cycles: the new parent may not be this category or one of its descendants.
    let cur: string | null = parentId;
    while (cur) {
      if (cur === id) return { error: "A category cannot be placed inside itself." };
      cur = (await prisma.category.findUnique({ where: { id: cur }, select: { parentId: true } }))?.parentId ?? null;
    }
  }
  const clash = await prisma.category.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) } });
  if (clash) return { error: "This slug is already used by another category." };
  const image = await maybeImage(fd, "categories");
  const data = { name, slug, parentId, description: i18nFrom(fd, "description", 1000), sortOrder: int(fd, "sortOrder") ?? 0, isActive: bool(fd, "isActive"), ...(image ? { image } : {}) };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  await audit(admin.email, id ? "category.update" : "category.create", slug);
  done();
  return { ok: true };
}

export async function deleteCategory(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return { error: "Not found" };
  await prisma.$transaction([
    prisma.category.updateMany({ where: { parentId: id }, data: { parentId: c.parentId } }),
    prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: c.parentId } }),
    prisma.category.delete({ where: { id } }),
  ]);
  await audit(admin.email, "category.delete", c.slug);
  done();
  return { ok: true, message: "Deleted. Its products and subcategories moved to the parent." };
}

export async function saveCollection(fd: FormData): Promise<ActionResult> {
  const admin = await assertAdmin();
  const id = str(fd, "id");
  const name = i18nFrom(fd, "name", 120);
  if (isEmptyI18n(name)) return { error: "Enter a name." };
  const slug = slugify(str(fd, "slug") || name.fr || name.en || "");
  if (!slug) return { error: "Enter a slug." };
  const clash = await prisma.collection.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) } });
  if (clash) return { error: "This slug is already used." };
  const image = await maybeImage(fd, "collections");
  const data = {
    name,
    slug,
    description: i18nFrom(fd, "description", 1000),
    badge: i18nFrom(fd, "badge", 40),
    isActive: bool(fd, "isActive"),
    featured: bool(fd, "featured"),
    isGift: bool(fd, "isGift"),
    sortOrder: int(fd, "sortOrder") ?? 0,
    startsAt: dateOrNull(fd, "startsAt"),
    endsAt: dateOrNull(fd, "endsAt"),
    ...(image ? { image } : {}),
  };
  const productIds = fd.getAll("products").map(String).filter(Boolean);
  const row = await prisma.$transaction(async (tx) => {
    const c = id ? await tx.collection.update({ where: { id }, data }) : await tx.collection.create({ data });
    if (fd.has("productsSubmitted")) {
      await tx.collectionProduct.deleteMany({ where: { collectionId: c.id } });
      if (productIds.length) await tx.collectionProduct.createMany({ data: productIds.map((productId, i) => ({ collectionId: c.id, productId, sortOrder: i })), skipDuplicates: true });
    }
    return c;
  });
  await audit(admin.email, id ? "collection.update" : "collection.create", slug);
  done();
  return id ? { ok: true } : { ok: true, redirect: `/admin/collections/${row.id}` };
}

export async function deleteCollection(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  await prisma.collection.delete({ where: { id: str(fd, "id") } });
  done();
  return { ok: true, redirect: "/admin/collections" };
}

export async function removeCollectionImage(fd: FormData): Promise<ActionResult> {
  await assertAdmin();
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  if (kind === "category") await prisma.category.update({ where: { id }, data: { image: null } });
  else await prisma.collection.update({ where: { id }, data: { image: null } });
  done();
  return { ok: true };
}
