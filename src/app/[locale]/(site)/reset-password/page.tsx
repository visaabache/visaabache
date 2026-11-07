import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { resetPasswordAction } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { SimpleAuthForm } from "@/components/forms/auth-forms";
import { Alert } from "@/components/ui/misc";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  return pageMetadata({ locale, path: "/reset-password", title: getDictionary(locale).auth.resetTitle, noIndex: true });
}

export default async function ResetPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const locale = asLocale((await params).locale);
  const { token } = await searchParams;
  const t = getDictionary(locale);
  return (
    <AuthShell title={t.auth.resetTitle}>
      {token ? (
        <SimpleAuthForm
          action={resetPasswordAction.bind(null, locale)}
          submit={t.auth.resetButton}
          hidden={{ token }}
          fields={[
            { name: "password", label: t.account.newPassword, type: "password", autoComplete: "new-password", hint: t.apply.passwordHint },
            { name: "confirmPassword", label: t.auth.confirmPassword, type: "password", autoComplete: "new-password" },
          ]}
        />
      ) : (
        <Alert tone="error">{t.auth.resetInvalid}</Alert>
      )}
    </AuthShell>
  );
}
