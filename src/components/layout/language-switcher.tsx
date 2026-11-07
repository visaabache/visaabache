"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale, light, compact }: { locale: Locale; light?: boolean; compact?: boolean }) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const rest = pathname.split("/").slice(2).join("/");
  const qs = search?.toString();

  return (
    <div className={cn("flex items-center gap-1", compact ? "" : "text-sm")}>
      <Globe className={cn("h-4 w-4", light ? "text-gold-300" : "text-slate-400")} aria-hidden />
      {locales.map((l) => (
        <a
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}${qs ? `?${qs}` : ""}`}
          hrefLang={l}
          lang={l}
          onClick={() => {
            document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
          }}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-semibold transition",
            l === locale
              ? light ? "bg-white/15 text-white" : "bg-navy-800 text-white"
              : light ? "text-navy-100 hover:text-white" : "text-slate-500 hover:text-navy-800",
          )}
          title={localeNames[l]}
        >
          {l === "ar" ? "ع" : l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
