import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDict, isLocale } from "@/lib/i18n";
import { countryName, shippingCountries } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import type { I18nText } from "@/lib/i18n/config";

export const metadata = { robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const [cities, codes, user] = await Promise.all([
    prisma.shippingCity.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] }),
    shippingCountries(),
    getCurrentUser(),
  ]);
  const countries = codes.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) => (a.code === "MA" ? -1 : b.code === "MA" ? 1 : a.name.localeCompare(b.name, locale)));
  return (
    <div className="container py-10 md:py-14">
      <h1 className="mb-8 font-display text-4xl font-semibold md:text-5xl">{d.checkout.title}</h1>
      <CheckoutForm
        cities={cities.map((c) => ({ id: c.id, name: c.name as I18nText, fee: c.fee, region: c.region }))}
        countries={countries}
        loggedIn={!!user}
        prefill={user ? { email: user.email, phone: user.phone, name: user.name, city: user.city, address: user.address, country: user.country } : {}}
      />
    </div>
  );
}
