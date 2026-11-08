import Link from "@/components/ui/link";
import { redirect } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth/session";
import { registerAction } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { RegisterForm } from "@/components/forms/auth-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  return pageMetadata({ locale, path: "/register", title: getDictionary(locale).nav.register, noIndex: true });
}

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const locale = asLocale((await params).locale);
  const { next } = await searchParams;
  const t = getDictionary(locale);
  if (await getCurrentUser()) redirect(`/${locale}/account`);
  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle} footer={<>{t.auth.haveAccount} <Link href={`/${locale}/login`} className="font-semibold text-navy-700 hover:underline">{t.nav.login}</Link></>}>
      <RegisterForm
        action={registerAction.bind(null, locale)}
        next={next}
        termsHref={`/${locale}/legal/terms`}
        privacyHref={`/${locale}/legal/privacy`}
        labels={{ firstName: t.auth.firstName, lastName: t.auth.lastName, email: t.auth.email, phone: t.auth.phone, password: t.auth.password, confirmPassword: t.auth.confirmPassword, passwordHint: t.apply.passwordHint, accept: t.auth.acceptPrivacy, marketing: t.auth.marketingOptIn, submit: t.auth.registerButton, terms: t.footer.terms, privacy: t.footer.privacy }}
      />
    </AuthShell>
  );
}
