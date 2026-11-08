import Link from "@/components/ui/link";
import { Trash2 } from "lucide-react";
import type { ChecklistItem, Country, Faq, OfficialLink, Question, VisaType } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { tr } from "@/lib/i18n/localized";
import {
  deleteChecklistItemAction, deleteFaqAction, deleteLinkAction, deleteQuestionAction, deleteVisaTypeAction, saveChecklistItemAction, saveCountryAction,
  saveFaqAction, saveLinkAction, saveQuestionAction, saveVisaTypeAction,
} from "@/actions/admin/content";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmForm } from "./confirm-form";
import { FormGrid, LocalizedInput } from "./fields";

function DeleteBtn({ action, t }: { action: () => Promise<void>; t: Dictionary }) {
  return (
    <ConfirmForm action={action} confirm={t.admin.content.deleteConfirm}>
      <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />{t.common.delete}</button>
    </ConfirmForm>
  );
}

function Item({ title, children, open }: { title: React.ReactNode; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-xl border border-gold-300 bg-white ring-1 ring-gold-200">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">{title}</span><span className="text-slate-400 group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

export type EditState = { editId?: string; add?: string; base: string };

/**
 * Compact list: only the item being edited (?edit=id) or added (?add=section) renders a full form.
 * Keeps very large editors (dozens of checklist rules) light and fast.
 */
function EditableList<T extends { id: string }>({ section, items, title, form, del, state, t }: {
  section: string; items: T[]; title: (x: T) => React.ReactNode; form: (x: T | null) => React.ReactNode; del: (x: T) => () => Promise<void>; state: EditState; t: Dictionary;
}) {
  const href = (q: string) => `${state.base}?${q}#${section}`;
  return (
    <div className="space-y-2">
      {items.map((x) =>
        state.editId === x.id ? (
          <Item key={x.id} title={title(x)} open>
            {form(x)}
            <div className="flex items-center justify-between">
              <DeleteBtn action={del(x)} t={t} />
              <Link href={`${state.base}#${section}`} className="text-xs text-slate-500 underline">{t.common.close}</Link>
            </div>
          </Item>
        ) : (
          <div key={x.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate">{title(x)}</span>
            <Link href={href(`edit=${x.id}`)} scroll={false} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50">{t.common.edit}</Link>
          </div>
        ),
      )}
      {state.add === section ? (
        <Item title={`+ ${t.admin.content.new}`} open>{form(null)}</Item>
      ) : (
        <Link href={href(`add=${section}`)} scroll={false} className="inline-flex rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-slate-50">+ {t.admin.content.new}</Link>
      )}
    </div>
  );
}

export function CountryForm({ c, locale, t }: { c: Country | null; locale: Locale; t: Dictionary }) {
  const tc = t.admin.content;
  return (
    <ActionForm action={saveCountryAction.bind(null, locale, c?.id ?? null)} submitLabel={t.common.save}>
      <LocalizedInput name="name" label={tc.name} value={c?.name} required />
      <FormGrid cols={4}>
        <Field label={tc.slug}><Input name="slug" defaultValue={c?.slug} dir="ltr" /></Field>
        <Field label={tc.isoCode}><Input name="isoCode" defaultValue={c?.isoCode} maxLength={2} className="uppercase" dir="ltr" /></Field>
        <Field label={tc.region}><Select name="region" defaultValue={c?.region || "EUROPE"}>{(["EUROPE", "NORTH_AMERICA", "ASIA", "OTHER"] as const).map((r) => <option key={r} value={r}>{t.regions[r]}</option>)}</Select></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} /></Field>
      </FormGrid>
      <div className="flex flex-wrap gap-6">
        <Checkbox name="isActive" defaultChecked={c?.isActive ?? true} label={tc.active} />
        <Checkbox name="isPopular" defaultChecked={c?.isPopular} label={tc.popular} />
        <Checkbox name="isSchengen" defaultChecked={c?.isSchengen} label={tc.schengen} />
      </div>
      <LocalizedInput name="summary" label={tc.summary} value={c?.summary} multiline rows={2} />
      <LocalizedInput name="eligibility" label={tc.eligibility} value={c?.eligibility} multiline rows={6} />
      <LocalizedInput name="procedure" label={tc.procedure} value={c?.procedure} multiline rows={6} />
      <LocalizedInput name="appointmentInfo" label={tc.appointment} value={c?.appointmentInfo} multiline rows={4} />
      <LocalizedInput name="processingInfo" label={`${tc.processing} (${t.common.indicative})`} value={c?.processingInfo} multiline rows={2} />
      <LocalizedInput name="officialFeesInfo" label={tc.officialFees} value={c?.officialFeesInfo} multiline rows={2} />
      <LocalizedInput name="importantNotes" label={tc.notes} value={c?.importantNotes} multiline rows={2} />
      <LocalizedInput name="seoTitle" label={tc.seoTitle} value={c?.seoTitle} />
      <LocalizedInput name="seoDescription" label={tc.seoDescription} value={c?.seoDescription} multiline rows={2} />
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <Field label={tc.verificationNote}><Input name="verificationNote" defaultValue={c?.verificationNote || ""} /></Field>
        <Checkbox name="markVerified" className="mt-3" label={<strong>{tc.markVerified}</strong>} />
        <p className="mt-1 text-xs text-slate-500">{tc.lastVerified}: {c?.lastVerifiedAt ? c.lastVerifiedAt.toISOString().slice(0, 10) : "—"}</p>
      </div>
    </ActionForm>
  );
}

export function VisaTypeEditor({ countryId, items, locale, t, state }: { countryId: string; items: VisaType[]; locale: Locale; t: Dictionary; state: EditState }) {
  const tc = t.admin.content;
  const form = (v: VisaType | null) => (
    <ActionForm action={saveVisaTypeAction.bind(null, locale, countryId, v?.id ?? null)} submitLabel={v ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!v}>
      <FormGrid cols={3}>
        <Field label={tc.code}><Input name="code" defaultValue={v?.code} required dir="ltr" placeholder="tourism" /></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={v?.sortOrder ?? items.length} /></Field>
        <Checkbox name="isActive" defaultChecked={v?.isActive ?? true} label={tc.active} className="self-end pb-2" />
      </FormGrid>
      <LocalizedInput name="name" label={tc.name} value={v?.name} required />
      <LocalizedInput name="description" label={tc.description} value={v?.description} />
      <LocalizedInput name="processingInfo" label={`${tc.processing} (${t.common.indicative})`} value={v?.processingInfo} />
      <LocalizedInput name="officialFee" label={tc.officialFees} value={v?.officialFee} />
    </ActionForm>
  );
  return <EditableList section="types" items={items} state={state} t={t} form={form} title={(x) => <><code className="text-xs text-slate-500">{x.code}</code> — {tr(x.name, locale)}{!x.isActive && " (off)"}</>} del={(x) => deleteVisaTypeAction.bind(null, locale, x.id)} />;
}

export function ChecklistEditor({ countryId, items, questions, locale, t, state }: { countryId: string; items: ChecklistItem[]; questions: Question[]; locale: Locale; t: Dictionary; state: EditState }) {
  const tc = t.admin.content;
  const form = (i: ChecklistItem | null) => {
    const cond = (i?.condition || {}) as { question?: string; op?: string; value?: string | string[] };
    return (
      <ActionForm action={saveChecklistItemAction.bind(null, locale, countryId, i?.id ?? null)} submitLabel={i ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!i}>
        <LocalizedInput name="title" label={tc.title} value={i?.title} required />
        <LocalizedInput name="description" label={tc.description} value={i?.description} />
        <FormGrid cols={4}>
          <Field label={tc.visaTypeCodes} className="sm:col-span-2"><Input name="visaTypeCodes" defaultValue={i?.visaTypeCodes.join(", ")} dir="ltr" /></Field>
          <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={i?.sortOrder ?? items.length} /></Field>
          <div className="flex flex-col gap-2 pt-6"><Checkbox name="required" defaultChecked={i?.required ?? true} label={t.common.required} /><Checkbox name="isActive" defaultChecked={i?.isActive ?? true} label={tc.active} /></div>
        </FormGrid>
        <fieldset className="rounded-lg bg-slate-50 p-3">
          <legend className="text-xs font-semibold text-slate-600">{tc.condition} — {tc.conditionHelp}</legend>
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select name="condQuestion" defaultValue={cond.question || ""}><option value="">—</option>{questions.map((q) => <option key={q.id} value={q.key}>{q.key} — {tr(q.label, locale).slice(0, 40)}</option>)}</Select>
            <Select name="condOp" defaultValue={cond.op || "eq"}><option value="eq">=</option><option value="neq">≠</option><option value="in">∈ (a,b)</option><option value="truthy">yes</option></Select>
            <Input name="condValue" defaultValue={Array.isArray(cond.value) ? cond.value.join(",") : cond.value || ""} placeholder="employed / yes" dir="ltr" />
          </div>
        </fieldset>
      </ActionForm>
    );
  };
  return <EditableList section="checklist" items={items} state={state} t={t} form={form} title={(x) => <>{x.required ? "●" : "○"} {tr(x.title, locale)}{x.condition ? " ⚙" : ""}{x.visaTypeCodes.length ? ` [${x.visaTypeCodes.join(",")}]` : ""}{!x.isActive && " (off)"}</>} del={(x) => deleteChecklistItemAction.bind(null, locale, x.id)} />;
}

export function QuestionEditor({ countryId, items, locale, t, state }: { countryId: string | null; items: Question[]; locale: Locale; t: Dictionary; state: EditState }) {
  const tc = t.admin.content;
  const optText = (q: Question | null) =>
    Array.isArray(q?.options) ? (q!.options as { value: string; label: Record<string, string> }[]).map((o) => [o.value, o.label.fr, o.label.ar, o.label.en].join(" | ")).join("\n") : "";
  const form = (q: Question | null) => (
    <ActionForm action={saveQuestionAction.bind(null, locale, countryId, q?.id ?? null)} submitLabel={q ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!q}>
      <FormGrid cols={4}>
        <Field label={tc.code}><Input name="key" defaultValue={q?.key} required dir="ltr" placeholder="employment" /></Field>
        <Field label={tc.questionType}><Select name="type" defaultValue={q?.type || "YES_NO"}>{(["YES_NO", "SELECT", "TEXT", "NUMBER", "DATE"] as const).map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label={tc.sortOrder}><Input name="sortOrder" type="number" defaultValue={q?.sortOrder ?? items.length} /></Field>
        <div className="flex flex-col gap-2 pt-6"><Checkbox name="required" defaultChecked={q?.required ?? true} label={t.common.required} /><Checkbox name="isActive" defaultChecked={q?.isActive ?? true} label={tc.active} /></div>
      </FormGrid>
      <LocalizedInput name="label" label={tc.question} value={q?.label} required />
      <LocalizedInput name="help" label={tc.description} value={q?.help} />
      <Field label={tc.options}><Textarea name="options" defaultValue={optText(q)} rows={4} dir="ltr" placeholder="employed | Salarié | أجير | Employed" /></Field>
      <Field label={tc.visaTypeCodes}><Input name="visaTypeCodes" defaultValue={q?.visaTypeCodes.join(", ")} dir="ltr" /></Field>
    </ActionForm>
  );
  return <EditableList section="questions" items={items} state={state} t={t} form={form} title={(x) => <><code className="text-xs text-slate-500">{x.key}</code> — {tr(x.label, locale)} <span className="text-xs text-slate-400">({x.type})</span></>} del={(x) => deleteQuestionAction.bind(null, locale, x.id)} />;
}

export function LinkEditor({ countryId, items, locale, t, state }: { countryId: string; items: OfficialLink[]; locale: Locale; t: Dictionary; state: EditState }) {
  const tc = t.admin.content;
  const form = (l: OfficialLink | null) => (
    <ActionForm action={saveLinkAction.bind(null, locale, countryId, l?.id ?? null)} submitLabel={l ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!l}>
      <LocalizedInput name="label" label={tc.label} value={l?.label} required />
      <FormGrid cols={3}>
        <Field label={tc.url} className="sm:col-span-2"><Input name="url" type="url" defaultValue={l?.url} required dir="ltr" placeholder="https://" /></Field>
        <Field label={tc.linkType}><Select name="type" defaultValue={l?.type || "GOVERNMENT"}>{(["GOVERNMENT", "EMBASSY", "CONSULATE", "VISA_CENTER", "OTHER"] as const).map((x) => <option key={x}>{x}</option>)}</Select></Field>
      </FormGrid>
      <Field label={tc.sortOrder} className="max-w-[120px]"><Input name="sortOrder" type="number" defaultValue={l?.sortOrder ?? items.length} /></Field>
    </ActionForm>
  );
  return <EditableList section="links" items={items} state={state} t={t} form={form} title={(x) => <>{tr(x.label, locale)} <span className="text-xs text-slate-400" dir="ltr">{x.url}</span></>} del={(x) => deleteLinkAction.bind(null, locale, x.id)} />;
}

export function FaqEditor({ scope, parentId, items, locale, t, state }: { scope: "GENERAL" | "COUNTRY" | "SERVICE"; parentId: string | null; items: Faq[]; locale: Locale; t: Dictionary; state: EditState }) {
  const tc = t.admin.content;
  const form = (f: Faq | null) => (
    <ActionForm action={saveFaqAction.bind(null, locale, scope, parentId, f?.id ?? null)} submitLabel={f ? t.common.save : t.common.add} submitSize="sm" resetOnSuccess={!f}>
      <LocalizedInput name="question" label={tc.question} value={f?.question} required />
      <LocalizedInput name="answer" label={tc.answer} value={f?.answer} multiline rows={3} required />
      <div className="flex flex-wrap items-center gap-6">
        <Field label={tc.sortOrder} className="w-28"><Input name="sortOrder" type="number" defaultValue={f?.sortOrder ?? items.length} /></Field>
        <Checkbox name="isPublished" defaultChecked={f?.isPublished ?? true} label={tc.published} />
        {scope === "GENERAL" && <Checkbox name="showOnHome" defaultChecked={f?.showOnHome} label={tc.showOnHome} />}
      </div>
    </ActionForm>
  );
  return <EditableList section="faqs" items={items} state={state} t={t} form={form} title={(x) => <>{tr(x.question, locale)}{!x.isPublished && " (off)"}{x.showOnHome && " ★"}</>} del={(x) => deleteFaqAction.bind(null, locale, x.id)} />;
}
