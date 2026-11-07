import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { forgotPasswordAction } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { SimpleAuthForm } from "@/components/forms/auth-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  return pageMetadata({ locale, path: "/forgot-password", title: getDictionary(locale).auth.forgotTitle, noIndex: true });
}

export default async function ForgotPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <SimpleAuthForm action={forgotPasswordAction.bind(null, locale)} submit={t.auth.forgotButton} fields={[{ name: "email", label: t.auth.email, type: "email", autoComplete: "email" }]} />
    </AuthShell>
  );
}
