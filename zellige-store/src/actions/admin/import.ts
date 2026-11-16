"use server";

import { revalidateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { importProducts, readSheet, type ImportReport } from "@/lib/product-sheet";
import { bool } from "@/lib/form";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";

export async function importSheet(fd: FormData): Promise<ActionResult & { data?: ImportReport }> {
  const admin = await assertAdmin();
  const file = fd.get("file");
  if (!file || typeof file !== "object" || !(file as File).size) return { error: "Choose a .xlsx or .csv file." };
  const f = file as File;
  if (!/\.(xlsx|csv)$/i.test(f.name)) return { error: "Only .xlsx and .csv files are supported." };
  if (f.size > 10 * 1024 * 1024) return { error: "File larger than 10 MB." };
  try {
    const sheet = await readSheet(f);
    if (!sheet.products.length && !sheet.variants.length) return { error: "The file has no data rows under the header." };
    const report = await importProducts(sheet, { publish: bool(fd, "publish") });
    await audit(admin.email, "products.import", f.name, { created: report.created, updated: report.updated, errors: report.errors.length });
    revalidateTag(CATALOG_TAG);
    return { ok: true, message: `${report.created} created, ${report.updated} updated, ${report.variants} variants, ${report.errors.length} errors`, data: report };
  } catch (e) {
    return { error: `Could not read the file: ${e instanceof Error ? e.message : "unknown error"}` };
  }
}
