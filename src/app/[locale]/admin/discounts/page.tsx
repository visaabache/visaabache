import { Trash2 } from "lucide-react";
import type { DiscountCode } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { deleteDiscountAction, saveDiscountAction } from "@/actions/admin/system";
import { Badge, Card } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function Discounts({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const td = t.admin.discounts;
  await requireStaff(locale, "marketing.manage");
  const items = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  const form = (d: DiscountCode | null) => (
    <ActionForm action={saveDiscountAction.bind(null, locale, d?.id ?? null)} submitLabel={d ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!d}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label={td.code}><Input name="code" defaultValue={d?.code} required className="uppercase" dir="ltr" /></Field>
        <Field label={td.type}><Select name="type" defaultValue={d?.type || "PERCENT"}><option value="PERCENT">{td.percent}</option><option value="FIXED">{td.fixed}</option></Select></Field>
        <Field label={td.value}><Input name="value" type="number" step="0.01" min="0" required defaultValue={d ? toNumber(d.value) : ""} /></Field>
        <Field label={td.maxUses}><Input name="maxUses" type="number" min="1" defaultValue={d?.maxUses ?? ""} /></Field>
        <Field label={td.minAmount}><Input name="minAmount" type="number" step="0.01" defaultValue={d?.minAmount ? toNumber(d.minAmount) : ""} /></Field>
        <Field label={td.validFrom}><Input name="validFrom" type="date" defaultValue={iso(d?.validFrom ?? null)} /></Field>
        <Field label={td.validUntil}><Input name="validUntil" type="date" defaultValue={iso(d?.validUntil ?? null)} /></Field>
        <Field label={td.packages}><Input name="packageSlugs" defaultValue={d?.packageSlugs.join(", ")} dir="ltr" /></Field>
      </div>
      <Field label={t.admin.content.description}><Input name="description" defaultValue={d?.description || ""} /></Field>
      <Checkbox name="isActive" defaultChecked={d?.isActive ?? true} label={t.admin.content.active} />
    </ActionForm>
  );
  return (
    <div className="max-w-5xl space-y-4">
      <AdminPageHeader title={td.title} />
      {items.map((d) => (
        <details key={d.id} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-3">
            <code className="font-bold">{d.code}</code>
            <span>{d.type === "PERCENT" ? `${toNumber(d.value)}%` : `${toNumber(d.value)} MAD`}</span>
            <span className="text-sm text-slate-500">{td.used}: {d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""}</span>
            {d.validUntil && <span className="text-sm text-slate-500">→ {formatDate(d.validUntil, locale)}</span>}
            {d.isActive ? <Badge tone="green">{t.admin.content.active}</Badge> : <Badge>off</Badge>}
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-5">{form(d)}<ConfirmForm action={deleteDiscountAction.bind(null, locale, d.id)} confirm={t.admin.content.deleteConfirm}><button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button></ConfirmForm></div>
        </details>
      ))}
      <Card className="p-5"><h2 className="mb-3 font-semibold">+ {t.admin.content.new}</h2>{form(null)}</Card>
    </div>
  );
}
