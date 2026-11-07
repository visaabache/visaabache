import { Star, Trash2 } from "lucide-react";
import type { Testimonial } from "@prisma/client";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteTestimonialAction, saveTestimonialAction } from "@/actions/admin/system";
import { Alert, Badge, Card } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Testimonials({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tt = t.admin.testimonials;
  await requireStaff(locale, "marketing.manage");
  const items = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" }, include: { application: true } });
  const form = (x: Testimonial | null) => {
    const locked = x?.source === "CUSTOMER_SUBMITTED";
    return (
      <ActionForm action={saveTestimonialAction.bind(null, locale, x?.id ?? null)} submitLabel={x ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!x}>
        {!locked && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Field label={t.common.name}><Input name="displayName" defaultValue={x?.displayName} required /></Field>
              <Field label={t.account.city}><Input name="city" defaultValue={x?.city || ""} /></Field>
              <Field label={tt.rating}><Select name="rating" defaultValue={String(x?.rating ?? 5)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
              <Field label={tt.source}><Select name="source" defaultValue={x?.source || "GOOGLE_REVIEW"}><option value="GOOGLE_REVIEW">{tt.sources.GOOGLE_REVIEW}</option><option value="ADMIN_ENTERED">{tt.sources.ADMIN_ENTERED}</option></Select></Field>
            </div>
            <Field label={t.account.reviewContent}><Textarea name="content" defaultValue={x?.content} required rows={3} /></Field>
            <Checkbox name="consentToPublish" defaultChecked={x?.consentToPublish} label={tt.consent} />
          </>
        )}
        {locked && <><input type="hidden" name="displayName" value={x!.displayName} /><input type="hidden" name="content" value={x!.content} /></>}
        <Field label={t.admin.content.verificationNote}><Input name="verificationNote" defaultValue={x?.verificationNote || ""} placeholder="e.g. Google review link / file VA-26-…" /></Field>
        <div className="flex flex-wrap gap-6">
          <Checkbox name="isVerified" defaultChecked={x?.isVerified} label={tt.verified} />
          <Checkbox name="isPublished" defaultChecked={x?.isPublished} label={tt.publish} />
        </div>
      </ActionForm>
    );
  };
  return (
    <div className="max-w-5xl space-y-4">
      <AdminPageHeader title={tt.title} />
      <Alert tone="warning">{tt.notice}</Alert>
      {items.map((x) => (
        <Card key={x.id} className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex text-gold-500">{Array.from({ length: x.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</span>
            <strong>{x.displayName}</strong><span className="text-sm text-slate-500">{x.city}</span>
            <Badge>{tt.sources[x.source]}</Badge>
            {x.application && <Badge tone="navy">{x.application.reference}</Badge>}
            {x.isVerified ? <Badge tone="green">{tt.verified}</Badge> : <Badge tone="amber">?</Badge>}
            {x.isPublished && <Badge tone="gold">{tt.publish}</Badge>}
            {!x.consentToPublish && <Badge tone="red">{tt.consent} ✗</Badge>}
            <span className="ms-auto text-xs text-slate-400">{formatDate(x.createdAt, locale)}</span>
          </div>
          <p className="mb-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm" lang={x.locale}>{x.content}</p>
          {form(x)}
          <ConfirmForm action={deleteTestimonialAction.bind(null, locale, x.id)} confirm={t.admin.content.deleteConfirm} className="mt-2"><button className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" />{t.common.delete}</button></ConfirmForm>
        </Card>
      ))}
      <Card className="p-5"><h2 className="mb-3 font-semibold">+ {t.admin.content.new}</h2>{form(null)}</Card>
    </div>
  );
}
