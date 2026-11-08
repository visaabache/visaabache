import Link from "@/components/ui/link";
import type { Banner } from "@prisma/client";
import { Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";

export function PromoBanner({ banner, locale }: { banner: Banner; locale: Locale }) {
  const navy = banner.variant === "navy";
  const href = banner.ctaUrl ? (banner.ctaUrl.startsWith("/") ? `/${locale}${banner.ctaUrl}` : banner.ctaUrl) : null;
  return (
    <div className={cn("no-print text-sm", navy ? "bg-navy-800 text-white" : "bg-gold-500 text-navy-900")}>
      <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center">
        <Sparkles className="h-4 w-4" aria-hidden />
        <span className="font-semibold">{tr(banner.title, locale)}</span>
        {banner.text && <span className="opacity-90">{tr(banner.text, locale)}</span>}
        {href && banner.ctaLabel && (
          <Link href={href} className="font-bold underline underline-offset-2">
            {tr(banner.ctaLabel, locale)}
          </Link>
        )}
      </div>
    </div>
  );
}
