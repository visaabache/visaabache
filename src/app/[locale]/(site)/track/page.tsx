import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { trackApplication } from "@/actions/public";
import { PageHero } from "@/components/site/cards";
import { Card } from "@/components/ui/misc";
import { TrackForm } from "@/components/forms/track-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/track", title: t.track.title, description: t.track.subtitle });
}

export default async function TrackPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref?: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const { ref } = await searchParams;
  return (
    <>
      <PageHero title={t.track.title} subtitle={t.track.subtitle} />
      <section className="container max-w-xl py-14">
        <Card className="p-6 sm:p-8">
          <TrackForm
            action={trackApplication.bind(null, locale)}
            defaultRef={ref}
            loginHref={`/${locale}/login`}
            labels={{ reference: t.track.reference, placeholder: t.track.referencePlaceholder, email: t.common.email, button: t.track.button, currentStatus: t.track.currentStatus, submittedOn: t.track.submittedOn, loginForMore: t.track.loginForMore, login: t.nav.login, destination: t.account.destination }}
          />
        </Card>
      </section>
    </>
  );
}
