import Link from "@/components/ui/link";
import { redirect } from "next/navigation";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { customerAccountsEnabled } from "@/lib/features";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/permissions";
import { safeNext } from "@/lib/validation";
import { loginAction } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { LoginForm } from "@/components/forms/auth-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  return pageMetadata({ locale, path: "/login", title: getDictionary(locale).nav.login, noIndex: true });
}

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const locale = asLocale((await params).locale);
  const { next } = await searchParams;
  const t = getDictionary(locale);
  // Customer accounts off: only staff sign in, on the admin sign-in page.
  if (!customerAccountsEnabled()) redirect(`/${locale}/admin/login`);
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next, isStaffRole(user.role) ? `/${locale}/admin` : `/${locale}/account`));
  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} footer={<>{t.auth.noAccount} <Link href={`/${locale}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-navy-700 hover:underline">{t.nav.register}</Link></>}>
      <LoginForm action={loginAction.bind(null, locale)} next={next} forgotHref={`/${locale}/forgot-password`} labels={{ email: t.auth.email, password: t.auth.password, forgot: t.auth.forgot, submit: t.auth.loginButton }} />
    </AuthShell>
  );
}
