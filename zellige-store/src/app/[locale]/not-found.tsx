import Link from "next/link";
import { headers } from "next/headers";
import { getDict, asLocale } from "@/lib/i18n";
import { ZelligeDivider } from "@/components/ui/Zellige";

export default async function NotFound() {
  const h = await headers();
  const locale = asLocale(h.get("x-locale"));
  const d = getDict(locale);
  return (
    <div className="container flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-semibold text-majorelle">404</p>
      <ZelligeDivider className="my-6" />
      <h1 className="font-display text-3xl font-semibold">{d.common.notFound}</h1>
      <p className="mt-3 text-charcoal-600">{d.common.notFoundText}</p>
      <Link href={`/${locale}`} className="btn-primary mt-8">{d.common.backHome}</Link>
    </div>
  );
}
