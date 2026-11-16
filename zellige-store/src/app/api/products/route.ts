import { getCardsByIds } from "@/lib/catalog";
import { json } from "@/lib/http";

export const runtime = "nodejs";

/** Product cards by id, for the wishlist page. */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter((x) => /^[a-z0-9]{10,40}$/i.test(x)).slice(0, 100);
  return json({ products: await getCardsByIds(ids) });
}
