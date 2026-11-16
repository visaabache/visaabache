import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { WishlistView } from "@/components/account/WishlistView";

export const metadata = { robots: { index: false } };

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <div className="container py-10 md:py-14">
      <h1 className="mb-8 font-display text-4xl font-semibold md:text-5xl">{d.wishlist.title}</h1>
      <WishlistView />
    </div>
  );
}
