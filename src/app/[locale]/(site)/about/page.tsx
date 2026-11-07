import { BadgeCheck, Ban, Compass, Eye, Lock, Scale } from "lucide-react";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/cards";
import { Card } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/about", title: t.about.title, description: t.about.intro.slice(0, 160) });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const values = [
    { icon: Eye, title: t.home.why1Title, text: t.home.why1Text },
    { icon: Lock, title: t.home.why2Title, text: t.home.why2Text },
    { icon: Compass, title: t.home.why3Title, text: t.home.why3Text },
    { icon: Scale, title: t.home.why4Title, text: t.home.why4Text },
  ];
  return (
    <>
      <PageHero title={t.about.title} subtitle={t.meta.tagline} />
      <section className="container grid grid-cols-1 gap-10 py-14 lg:grid-cols-2">
        <div className="space-y-6 text-lg leading-relaxed text-slate-700">
          <p>{t.about.intro}</p>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold text-navy-800"><BadgeCheck className="h-5 w-5 text-emerald-600" /> {t.about.missionTitle}</h2>
            <p className="mt-2 text-base text-slate-600">{t.about.mission}</p>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-navy-800"><Ban className="h-5 w-5 text-amber-600" /> {t.about.notTitle}</h2>
            <p className="mt-2 text-base text-slate-600">{t.about.not}</p>
          </Card>
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-navy-800">{t.about.valuesTitle}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} className="p-5">
                <v.icon className="h-7 w-7 text-gold-600" />
                <h3 className="mt-3 font-semibold text-navy-800">{v.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{v.text}</p>
              </Card>
            ))}
          </div>
          <ButtonLink href={`/${locale}/apply`} size="lg" className="mt-8">{t.common.applyForAssistance}</ButtonLink>
        </div>
      </section>
    </>
  );
}
