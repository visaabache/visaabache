import { Trash2 } from "lucide-react";
import type { Banner } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteBannerAction, saveBannerAction } from "@/actions/admin/system";
import { Badge, Card } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LocalizedInput } from "@/components/admin/fields";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function Banners({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tc = t.admin.content;
  await requireStaff(locale, "marketing.manage");
  const items = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  const form = (b: Banner | null) => (
    <ActionForm action={saveBannerAction.bind(null, locale, b?.id ?? null)} submitLabel={b ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!b}>
      <LocalizedInput name="title" label={tc.title} value={b?.title} required />
      <LocalizedInput name="text" label={tc.text} value={b?.text} />
      <LocalizedInput name="ctaLabel" label={tc.ctaLabel} value={b?.ctaLabel} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label={tc.ctaUrl}><Input name="ctaUrl" defaultValue={b?.ctaUrl || ""} placeholder="/apply" dir="ltr" /></Field>
        <Field label={tc.variant}><Select name="variant" defaultValue={b?.variant || "gold"}><option value="gold">gold</option><option value="navy">navy</option></Select></Field>
        <Field label={tc.startsAt}><Input type="date" name="startsAt" defaultValue={iso(b?.startsAt ?? null)} /></Field>
        <Field label={tc.endsAt}><Input type="date" name="endsAt" defaultValue={iso(b?.endsAt ?? null)} /></Field>
      </div>
      <Checkbox name="isActive" defaultChecked={b?.isActive ?? true} label={tc.active} />
    </ActionForm>
  );
  return (
    <div className="max-w-5xl space-y-4">
      <AdminPageHeader title={t.admin.nav.banners} />
      {items.map((b) => (
        <details key={b.id} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 font-medium">{tr(b.title, locale)} {b.isActive ? <Badge tone="green">{tc.active}</Badge> : <Badge>off</Badge>}</summary>
          <div className="space-y-3 border-t border-slate-100 p-5">{form(b)}<ConfirmForm action={deleteBannerAction.bind(null, locale, b.id)} confirm={tc.deleteConfirm}><button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button></ConfirmForm></div>
        </details>
      ))}
      <Card className="p-5"><h2 className="mb-3 font-semibold">+ {tc.new}</h2>{form(null)}</Card>
    </div>
  );
}
