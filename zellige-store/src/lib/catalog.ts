import "server-only";
import { Prisma, type ProductStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "./db";
import type { I18nText } from "./i18n/config";

/** Everything the storefront reads goes through these cached queries; admin writes call revalidateTag("catalog"). */
export const CATALOG_TAG = "catalog";
const NEW_DAYS = 45;

export type ProductCard = {
  id: string;
  slug: string;
  name: I18nText;
  price: number;
  compareAtPrice: number | null;
  fromPrice: boolean;
  image: { url: string; alt: I18nText | null; width: number | null; height: number | null } | null;
  image2: { url: string; alt: I18nText | null } | null;
  available: number;
  ratingAvg: number;
  ratingCount: number;
  isNew: boolean;
  giftable: boolean;
  hasVariants: boolean;
};

export const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  variants: { where: { isActive: true }, select: { price: true, stock: true } },
} satisfies Prisma.ProductInclude;

type CardSource = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toCard(p: CardSource): ProductCard {
  const variantPrices = p.variants.map((v) => v.price ?? p.price);
  const min = variantPrices.length ? Math.min(...variantPrices) : p.price;
  const [a, b] = p.images;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name as I18nText,
    price: min,
    compareAtPrice: p.compareAtPrice && p.compareAtPrice > min ? p.compareAtPrice : null,
    fromPrice: new Set(variantPrices).size > 1,
    image: a ? { url: a.url, alt: a.alt as I18nText | null, width: a.width, height: a.height } : null,
    image2: b ? { url: b.url, alt: b.alt as I18nText | null } : null,
    available: p.variants.length ? p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0) : Math.max(0, p.stock),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    isNew: !!p.publishedAt && Date.now() - p.publishedAt.getTime() < NEW_DAYS * 86400_000,
    giftable: p.giftable,
    hasVariants: p.variants.length > 0,
  };
}

const published: Prisma.ProductWhereInput = { status: "PUBLISHED" };

export type CategoryNode = { id: string; slug: string; name: I18nText; description: I18nText | null; image: string | null; parentId: string | null; count: number; children: CategoryNode[] };

export const getCategoryTree = unstable_cache(
  async (): Promise<CategoryNode[]> => {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      include: { _count: { select: { products: { where: published } } } },
    });
    const nodes = new Map<string, CategoryNode>(
      rows.map((c) => [c.id, { id: c.id, slug: c.slug, name: c.name as I18nText, description: c.description as I18nText | null, image: c.image, parentId: c.parentId, count: c._count.products, children: [] }]),
    );
    const roots: CategoryNode[] = [];
    for (const n of nodes.values()) (n.parentId && nodes.get(n.parentId) ? nodes.get(n.parentId)!.children : roots).push(n);
    const total = (n: CategoryNode): number => (n.count = n.count + n.children.reduce((s, c) => s + total(c), 0));
    roots.forEach(total);
    return roots;
  },
  ["category-tree"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export function flattenTree(nodes: CategoryNode[], depth = 0): (CategoryNode & { depth: number })[] {
  return nodes.flatMap((n) => [{ ...n, depth }, ...flattenTree(n.children, depth + 1)]);
}

export function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const f = findCategory(n.children, slug);
    if (f) return f;
  }
  return null;
}

const descendantIds = (n: CategoryNode): string[] => [n.id, ...n.children.flatMap(descendantIds)];

export type ShopQuery = {
  q?: string;
  category?: string;
  collection?: string;
  min?: number;
  max?: number;
  colors?: string[];
  patterns?: string[];
  inStock?: boolean;
  sort?: string;
  page?: number;
};

export const PAGE_SIZE = 24;

async function searchIds(q: string) {
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
    WHERE status = 'PUBLISHED'
      AND (name::text ILIKE ${like} OR sku ILIKE ${like} OR "shortDescription"::text ILIKE ${like}
           OR array_to_string(colors, ' ') ILIKE ${like} OR array_to_string(patterns, ' ') ILIKE ${like})
    LIMIT 500`;
  return rows.map((r) => r.id);
}

export const searchProducts = unstable_cache(
  async (query: ShopQuery) => {
    const where: Prisma.ProductWhereInput = { ...published };
    const and: Prisma.ProductWhereInput[] = [];
    if (query.category) {
      const node = findCategory(await getCategoryTree(), query.category);
      and.push({ categoryId: { in: node ? descendantIds(node) : ["__none__"] } });
    }
    if (query.collection) and.push({ collections: { some: { collection: { slug: query.collection, isActive: true } } } });
    if (query.q?.trim()) and.push({ id: { in: await searchIds(query.q.trim()) } });
    if (query.min !== undefined) and.push({ price: { gte: query.min } });
    if (query.max !== undefined) and.push({ price: { lte: query.max } });
    if (query.colors?.length) and.push({ colors: { hasSome: query.colors } });
    if (query.patterns?.length) and.push({ patterns: { hasSome: query.patterns } });
    if (query.inStock) and.push({ OR: [{ stock: { gt: 0 } }, { variants: { some: { isActive: true, stock: { gt: 0 } } } }] });
    if (and.length) where.AND = and;

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sort === "newest" ? [{ publishedAt: "desc" }]
      : query.sort === "bestselling" ? [{ salesCount: "desc" }, { publishedAt: "desc" }]
      : query.sort === "priceAsc" ? [{ price: "asc" }]
      : query.sort === "priceDesc" ? [{ price: "desc" }]
      : query.sort === "rating" ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }]
      : [{ featured: "desc" }, { salesCount: "desc" }, { publishedAt: "desc" }];

    const page = Math.max(1, query.page || 1);
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy: [...orderBy, { id: "asc" }], include: cardInclude, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    ]);
    return { total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), products: rows.map(toCard) };
  },
  ["search-products"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

export const getFacets = unstable_cache(
  async () => {
    const rows = await prisma.$queryRaw<{ kind: string; value: string; n: bigint }[]>`
      SELECT 'color' AS kind, unnest(colors) AS value, count(*) AS n FROM "Product" WHERE status = 'PUBLISHED' GROUP BY 2
      UNION ALL
      SELECT 'pattern', unnest(patterns), count(*) FROM "Product" WHERE status = 'PUBLISHED' GROUP BY 2`;
    const price = await prisma.product.aggregate({ where: published, _min: { price: true }, _max: { price: true } });
    const pick = (k: string) => rows.filter((r) => r.kind === k).sort((a, b) => Number(b.n) - Number(a.n)).map((r) => r.value);
    return { colors: pick("color"), patterns: pick("pattern"), minPrice: price._min.price ?? 0, maxPrice: price._max.price ?? 0 };
  },
  ["facets"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getProductList = unstable_cache(
  async (kind: "featured" | "bestsellers" | "new" | "gifts", take = 8) => {
    const where: Prisma.ProductWhereInput =
      kind === "featured" ? { ...published, featured: true } : kind === "gifts" ? { ...published, giftable: true } : published;
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      kind === "bestsellers" ? [{ salesCount: "desc" }, { ratingAvg: "desc" }, { publishedAt: "desc" }]
      : kind === "new" ? [{ publishedAt: "desc" }]
      : [{ salesCount: "desc" }, { publishedAt: "desc" }];
    const rows = await prisma.product.findMany({ where, orderBy, include: cardInclude, take });
    return rows.map(toCard);
  },
  ["product-list"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

export const getCardsByIds = async (ids: string[]) => {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { ...published, id: { in: ids.slice(0, 100) } }, include: cardInclude });
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.map(toCard).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
};

export type CollectionCard = { id: string; slug: string; name: I18nText; description: I18nText | null; badge: I18nText | null; image: string | null; isGift: boolean; count: number };

function activeCollectionWhere(): Prisma.CollectionWhereInput {
  const now = new Date();
  return { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] };
}

export const getCollections = unstable_cache(
  async (opts: { featured?: boolean; gift?: boolean } = {}): Promise<CollectionCard[]> => {
    const rows = await prisma.collection.findMany({
      where: { ...activeCollectionWhere(), ...(opts.featured ? { featured: true } : {}), ...(opts.gift ? { isGift: true } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { products: { where: { product: published } } } },
        products: { where: { product: published }, orderBy: { sortOrder: "asc" }, take: 1, include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } },
      },
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name as I18nText,
      description: c.description as I18nText | null,
      badge: c.badge as I18nText | null,
      image: c.image || c.products[0]?.product.images[0]?.url || null,
      isGift: c.isGift,
      count: c._count.products,
    }));
  },
  ["collections"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

export const getCollection = unstable_cache(
  async (slug: string) => {
    const c = await prisma.collection.findFirst({ where: { slug, ...activeCollectionWhere() } });
    return c ? { id: c.id, slug: c.slug, name: c.name as I18nText, description: c.description as I18nText | null, badge: c.badge as I18nText | null, image: c.image } : null;
  },
  ["collection"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

const productInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
  category: { include: { parent: true } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Not cached across requests: admins preview drafts, and stock must be current on the product page. */
export const getProduct = cache(async (slug: string, opts: { allowUnpublished?: boolean } = {}) => {
  const statuses: ProductStatus[] = opts.allowUnpublished ? ["PUBLISHED", "DRAFT", "ARCHIVED"] : ["PUBLISHED"];
  return prisma.product.findFirst({ where: { slug, status: { in: statuses } }, include: productInclude });
});

export const getRelated = unstable_cache(
  async (productId: string, categoryId: string | null, take = 4) => {
    const rows = await prisma.product.findMany({
      where: { ...published, id: { not: productId }, ...(categoryId ? { categoryId } : {}) },
      orderBy: [{ salesCount: "desc" }, { publishedAt: "desc" }],
      include: cardInclude,
      take,
    });
    if (rows.length < take) {
      const more = await prisma.product.findMany({
        where: { ...published, id: { notIn: [productId, ...rows.map((r) => r.id)] } },
        orderBy: [{ featured: "desc" }, { salesCount: "desc" }],
        include: cardInclude,
        take: take - rows.length,
      });
      rows.push(...more);
    }
    return rows.map(toCard);
  },
  ["related"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

export const getApprovedReviews = (productId: string) =>
  prisma.review.findMany({ where: { productId, status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 50 });

export const getGalleryImages = unstable_cache(
  async (take = 8) => {
    const rows = await prisma.productImage.findMany({
      where: { product: published, sortOrder: 0 },
      orderBy: { product: { salesCount: "desc" } },
      include: { product: { select: { slug: true, name: true } } },
      take,
    });
    return rows.map((r) => ({ url: r.url, slug: r.product.slug, name: r.product.name as I18nText }));
  },
  ["gallery"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getTestimonials = unstable_cache(
  async () => {
    const rows = await prisma.testimonial.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 6 });
    return rows.map((t) => ({ id: t.id, name: t.name, city: t.city, quote: t.quote as I18nText, rating: t.rating }));
  },
  ["testimonials"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);
