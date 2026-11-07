import Link from "next/link";
import { LayoutDashboard, LogOut, Search, ShieldCheck, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import type { CurrentUser } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/permissions";
import { logoutAction } from "@/actions/auth";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { FloatingHeader } from "@/components/motion/floating-header";

export function Header({ locale, dict, user }: { locale: Locale; dict: Dictionary; user: CurrentUser | null }) {
  const l = (p: string) => `/${locale}${p}`;
  const links = [
    { href: l("/visas"), label: dict.nav.visas },
    { href: l("/services"), label: dict.nav.services },
    { href: l("/pricing"), label: dict.nav.pricing },
    { href: l("/blog"), label: dict.nav.blog },
    { href: l("/about"), label: dict.nav.about },
    { href: l("/contact"), label: dict.nav.contact },
  ];
  const staff = user && isStaffRole(user.role);

  return (
    <FloatingHeader>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={l("")} aria-label="VISA ABACHE" className="shrink-0">
          <Logo className="h-11 sm:h-12" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((x) => (
            <Link key={x.href} href={x.href} className="relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-navy-50 hover:text-navy-800 xl:px-3">
              {x.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          <Link href={l("/track")} className="rounded-lg p-2 text-slate-500 hover:bg-navy-50 hover:text-navy-800" title={dict.nav.track} aria-label={dict.nav.track}>
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            <>
              {staff && (
                <Link href={l("/admin")} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                  <ShieldCheck className="h-4 w-4" /> {dict.nav.admin}
                </Link>
              )}
              <Link href={l("/account")} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                <UserRound className="h-4 w-4" /> {dict.nav.account}
              </Link>
            </>
          ) : (
            <Link href={l("/login")} className="text-sm font-medium text-navy-700 hover:text-navy-900">
              {dict.nav.login}
            </Link>
          )}
          <ButtonLink href={l("/apply")} size="md" className="btn-shine">
            {dict.common.applyForAssistance}
          </ButtonLink>
        </div>
        <MobileMenu label={dict.nav.menu}>
          <nav className="flex flex-col divide-y divide-slate-100" aria-label="Mobile">
            {[{ href: l(""), label: dict.nav.home }, ...links, { href: l("/faq"), label: dict.nav.faq }, { href: l("/track"), label: dict.nav.track }].map((x) => (
              <Link key={x.href} href={x.href} className="px-2 py-3.5 text-base font-medium text-navy-800 hover:bg-navy-50">
                {x.label}
              </Link>
            ))}
          </nav>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex flex-col gap-2">
            <ButtonLink href={l("/apply")} size="lg">
              {dict.common.applyForAssistance}
            </ButtonLink>
            {user ? (
              <>
                {staff && (
                  <ButtonLink href={l("/admin")} variant="outline" size="lg">
                    <LayoutDashboard className="h-4 w-4" /> {dict.nav.admin}
                  </ButtonLink>
                )}
                <ButtonLink href={l("/account")} variant="outline" size="lg">
                  <UserRound className="h-4 w-4" /> {dict.nav.account}
                </ButtonLink>
                <form action={logoutAction.bind(null, locale)}>
                  <button className="flex w-full items-center justify-center gap-2 py-3 text-sm text-slate-500">
                    <LogOut className="h-4 w-4" /> {dict.nav.logout}
                  </button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href={l("/login")} variant="outline" size="lg">
                  {dict.nav.login}
                </ButtonLink>
                <ButtonLink href={l("/register")} variant="ghost" size="lg">
                  {dict.nav.register}
                </ButtonLink>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <LanguageSwitcher locale={locale} />
          </div>
        </MobileMenu>
      </div>
    </FloatingHeader>
  );
}
