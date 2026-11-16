import "server-only";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { MAD, type DisplayCurrency } from "./money";

export const CURRENCY_COOKIE = "dz_currency";

export const getCurrencies = unstable_cache(
  async (): Promise<DisplayCurrency[]> => {
    const rows = await prisma.currency.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    const list = rows.map((r) => ({ code: r.code, symbol: r.symbol, rate: r.code === "MAD" ? 1 : r.rateFromMad, decimals: r.decimals }));
    return list.some((c) => c.code === "MAD") ? list : [MAD, ...list];
  },
  ["currencies"],
  { tags: ["currencies"], revalidate: 3600 },
);

export async function getDisplayCurrency(): Promise<DisplayCurrency> {
  const code = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (!code || code === "MAD") return MAD;
  return (await getCurrencies()).find((c) => c.code === code) ?? MAD;
}
