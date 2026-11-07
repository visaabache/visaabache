import type { Article, ApplicationStatus, LegalPage, Package, Service } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { saveArticleAction, saveLegalPageAction, savePackageAction, saveServiceAction, saveStatusAction } from "@/actions/admin/content";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { ICON_NAMES } from "@/components/ui/icons";
import { ActionForm } from "@/components/forms/action-form";
import { toNumber } from "@/lib/utils";
import { FormGrid, LocalizedInput } from "./fields";

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export function ServiceForm({ s, locale, t }: { s: Service | null; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={saveServiceAction.bind(null, locale, s?.id ?? null)} submitLabel={t.common.save}>
      <LocalizedInput name="name" label={tc.name} value={s?.name} required />
      <FormGrid cols={4}>
        <Field label={tc.slug}><Input name="slug" defaultValue={s?.slug} dir="ltr" /></Field>
        <Field label={tc.category}><Select name="category" defaultValue={s?.category || "ADMINISTRATIVE"}>{(["VISA", "ADMINISTRATIVE", "TRAVEL", "STUDY"] as const).map((c) => <option key={c} value={c}>{t.services.categories[c]}</option>)}</Select></Field>
        <Field label={tc.icon}><Select name="icon" defaultValue={s?.icon || "file-text"}>{ICON_NAMES.map((i) => <option key={i}>{i}</option>)}</Select></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} /></Field>
      </FormGrid>
      <FormGrid cols={4}>
        <Field label={tc.priceType}><Select name="priceType" defaultValue={s?.priceType || "FROM"}>{(["FIXED", "FROM", "QUOTE"] as const).map((p) => <option key={p} value={p}>{tc.priceTypes[p]}</option>)}</Select></Field>
        <Field label={tc.price}><Input name="price" type="number" step="0.01" min="0" defaultValue={s?.price ? toNumber(s.price) : ""} /></Field>
        <Checkbox name="isActive" defaultChecked={s?.isActive ?? true} label={tc.active} className="self-end pb-2" />
        <Checkbox name="isFeatured" defaultChecked={s?.isFeatured} label={tc.featured} className="self-end pb-2" />
      </FormGrid>
      <LocalizedInput name="shortDescription" label={tc.shortDescription} value={s?.shortDescription} multiline rows={2} required />
      <LocalizedInput name="description" label={tc.longDescription} value={s?.description} multiline rows={5} />
      <LocalizedInput name="features" label={tc.features} value={s?.features} multiline rows={4} />
      <LocalizedInput name="disclaimer" label={tc.disclaimer} value={s?.disclaimer} multiline rows={2} hint={t.services.disclaimerDefault} />
      <LocalizedInput name="seoTitle" label={tc.seoTitle} value={s?.seoTitle} />
      <LocalizedInput name="seoDescription" label={tc.seoDescription} value={s?.seoDescription} multiline rows={2} />
    </ActionForm>
  );
}

export function PackageForm({ p, locale, t }: { p: Package | null; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={savePackageAction.bind(null, locale, p?.id ?? null)} submitLabel={t.common.save}>
      <LocalizedInput name="name" label={tc.name} value={p?.name} required />
      <FormGrid cols={4}>
        <Field label={tc.slug}><Input name="slug" defaultValue={p?.slug} dir="ltr" /></Field>
        <Field label={tc.price} required><Input name="price" type="number" step="0.01" min="0" required defaultValue={p ? toNumber(p.price) : ""} /></Field>
        <Field label={tc.compareAt}><Input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={p?.compareAtPrice ? toNumber(p.compareAtPrice) : ""} /></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} /></Field>
      </FormGrid>
      <div className="flex flex-wrap gap-6">
        <Checkbox name="isActive" defaultChecked={p?.isActive ?? true} label={tc.active} />
        <Checkbox name="isHighlighted" defaultChecked={p?.isHighlighted} label={tc.highlighted} />
        <Checkbox name="isPromotional" defaultChecked={p?.isPromotional} label={tc.promotional} />
      </div>
      <FormGrid>
        <Field label={tc.promoEnds}><Input name="promoEndsAt" type="date" defaultValue={iso(p?.promoEndsAt)} /></Field>
        <Field label={tc.countrySlugs}><Input name="countrySlugs" defaultValue={p?.countrySlugs.join(", ")} dir="ltr" /></Field>
      </FormGrid>
      <LocalizedInput name="description" label={tc.description} value={p?.description} multiline rows={2} />
      <LocalizedInput name="features" label={tc.features} value={p?.features} multiline rows={5} />
    </ActionForm>
  );
}

export function StatusForm({ s, locale, t }: { s: ApplicationStatus | null; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={saveStatusAction.bind(null, locale, s?.id ?? null)} submitLabel={s ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!s}>
      <FormGrid cols={4}>
        <Field label={tc.code}><Input name="key" defaultValue={s?.key} dir="ltr" required /></Field>
        <Field label={tc.kind}><Select name="kind" defaultValue={s?.kind || "OPEN"}>{(["OPEN", "WAITING_CUSTOMER", "COMPLETED", "CANCELLED"] as const).map((k) => <option key={k} value={k}>{t.statusKind[k]}</option>)}</Select></Field>
        <Field label={tc.color}><Input name="color" type="color" defaultValue={s?.color || "#2f4f85"} className="h-10 p-1" /></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 99} /></Field>
      </FormGrid>
      <div className="flex flex-wrap gap-6">
        <Checkbox name="isActive" defaultChecked={s?.isActive ?? true} label={tc.active} />
        <Checkbox name="notifyCustomer" defaultChecked={s?.notifyCustomer ?? true} label={tc.notifyCustomer} />
        <Checkbox name="isInitial" defaultChecked={s?.isInitial} label={tc.initial} />
      </div>
      <LocalizedInput name="label" label={tc.label} value={s?.label} required />
      <LocalizedInput name="description" label={tc.description} value={s?.description} />
    </ActionForm>
  );
}

export function ArticleForm({ a, locale, t }: { a: Article | null; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={saveArticleAction.bind(null, locale, a?.id ?? null)} submitLabel={t.common.save}>
      <LocalizedInput name="title" label={tc.title} value={a?.title} required />
      <FormGrid cols={4}>
        <Field label={tc.slug}><Input name="slug" defaultValue={a?.slug} dir="ltr" /></Field>
        <Field label={tc.category}><Select name="category" defaultValue={a?.category || "VISA_INFO"}>{(["VISA_INFO", "TRAVEL_ADVICE", "ADMIN_PROCEDURES", "OPPORTUNITIES"] as const).map((c) => <option key={c} value={c}>{t.blog.categories[c]}</option>)}</Select></Field>
        <Field label={tc.author}><Input name="authorName" defaultValue={a?.authorName || "VISA ABACHE"} /></Field>
        <Field label={t.blog.published}><Input name="publishedAt" type="date" defaultValue={iso(a?.publishedAt)} /></Field>
      </FormGrid>
      <FormGrid>
        <Field label={tc.cover}><Input name="coverImageUrl" defaultValue={a?.coverImageUrl || ""} dir="ltr" placeholder="https://…" /></Field>
        <Field label={tc.tags}><Input name="tags" defaultValue={a?.tags.join(", ")} /></Field>
      </FormGrid>
      <Checkbox name="isPublished" defaultChecked={a?.isPublished} label={tc.published} />
      <LocalizedInput name="excerpt" label={tc.excerpt} value={a?.excerpt} multiline rows={2} />
      <LocalizedInput name="content" label={tc.body} value={a?.content} multiline rows={14} required />
      <LocalizedInput name="seoTitle" label={tc.seoTitle} value={a?.seoTitle} />
      <LocalizedInput name="seoDescription" label={tc.seoDescription} value={a?.seoDescription} multiline rows={2} />
    </ActionForm>
  );
}

export function LegalForm({ p, locale, t }: { p: LegalPage; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={saveLegalPageAction.bind(null, locale, p.id)} submitLabel={t.common.save}>
      <FormGrid cols={4}><Field label={tc.version}><Input name="version" defaultValue={p.version} /></Field></FormGrid>
      <LocalizedInput name="title" label={tc.title} value={p.title} required />
      <LocalizedInput name="content" label={tc.body} value={p.content} multiline rows={18} required />
    </ActionForm>
  );
}
