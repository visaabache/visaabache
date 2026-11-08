import Link from "@/components/ui/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/permissions";
import { loginAction } from "@/actions/auth";
import { LoginForm } from "@/components/forms/auth-forms";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Aurora } from "@/components/motion/aurora";

export const metadata = { robots: { index: false, follow: false }, title: "Administration — VISA ABACHE" };

/** Staff-only sign-in, separate from the customer login: no sign-up link, no public header/footer. */
export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (user && isStaffRole(user.role)) redirect(`/${locale}/admin`);

  return (
    <main className="noise relative flex min-h-screen flex-col overflow-hidden bg-navy-950">
      <Aurora />
      <div className="bg-grid mask-radial absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-1.5 text-sm text-navy-200 transition hover:text-white">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.auth.backToSite}
        </Link>
        <LanguageSwitcher locale={locale} light />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md animate-pop-in">
          <div className="mb-6 flex justify-center">
            <Logo className="h-20" />
          </div>
          <div className="rounded-3xl bg-white p-7 shadow-premium sm:p-9">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400"><LockKeyhole className="h-5 w-5" /></div>
              <div>
                <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl text-navy-800">{t.auth.adminLoginTitle}</h1>
                <p className="text-sm text-slate-500">{t.auth.adminLoginSubtitle}</p>
              </div>
            </div>
            <LoginForm
              action={loginAction.bind(null, locale)}
              area="admin"
              next={`/${locale}/admin`}
              forgotHref={`/${locale}/forgot-password`}
              labels={{ email: t.auth.email, password: t.auth.password, forgot: t.auth.forgot, submit: t.auth.loginButton }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
