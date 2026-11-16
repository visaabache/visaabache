import { notFound, redirect } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/account/AuthForms";

export const metadata = { robots: { index: false } };

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(`/${locale}/account`);
  return (
    <div className="container max-w-md py-14 md:py-20">
      <h1 className="mb-8 text-center font-display text-4xl font-semibold">{getDict(locale).account.register}</h1>
      <RegisterForm next={next} />
    </div>
  );
}
