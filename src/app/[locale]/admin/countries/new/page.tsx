import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { Card } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CountryForm } from "@/components/admin/country-editors";

export default async function NewCountry({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  await requireStaff(locale, "content.manage");
  return (<div className="max-w-5xl"><AdminPageHeader title={`${t.admin.nav.countries} — ${t.admin.content.new}`} /><Card className="p-6"><CountryForm c={null} locale={locale} t={t} /></Card></div>);
}
