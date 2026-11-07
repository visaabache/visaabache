import { headers } from "next/headers";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const locale = asLocale((await headers()).get("x-locale"));
  const t = getDictionary(locale);
  return (
    <section className="container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-semibold text-gold-500">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-navy-800">{t.errors.notFoundTitle}</h1>
      <p className="mt-2 text-slate-600">{t.errors.notFoundText}</p>
      <ButtonLink href={`/${locale}`} className="mt-6">{t.errors.goHome}</ButtonLink>
    </section>
  );
}
