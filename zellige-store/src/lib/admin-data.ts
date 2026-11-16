import "server-only";
import { prisma } from "./db";
import { tr } from "./i18n/config";

/** Category options with their path ("Céramique › Mugs") for selects. */
export async function categoryOptions() {
  const all = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] });
  const byId = new Map(all.map((c) => [c.id, c]));
  const path = (id: string): string => {
    const c = byId.get(id)!;
    const name = tr(c.name, "fr");
    return c.parentId && byId.has(c.parentId) ? `${path(c.parentId)} › ${name}` : name;
  };
  return all.map((c) => ({ id: c.id, label: path(c.id) })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export async function collectionOptions() {
  const rows = await prisma.collection.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return rows.map((c) => ({ id: c.id, label: tr(c.name, "fr") + (c.isActive ? "" : " (inactive)") }));
}
