"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, FileUp, Loader2, PartyPopper, Search, Tag } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { buildChecklist } from "@/lib/domain/checklist";
import { saveDraftAction, submitApplicationAction, uploadDocumentAction, checkDiscountAction } from "@/actions/apply";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type Q = { key: string; label: string; help: string; type: string; required: boolean; visaTypeCodes: string[]; options: { value: string; label: string }[] };
type CL = { id: string; title: string; description: string; required: boolean; visaTypeCodes: string[]; condition: unknown; isActive: boolean; sortOrder: number };
type Doc = { id: string; label: string; name: string; checklistItemId: string | null };
type Details = Record<
  "firstName" | "lastName" | "email" | "phone" | "dateOfBirth" | "nationality" | "passportNumber" | "passportExpiry" | "city" | "purpose" | "departureDate" | "returnDate" | "travelers" | "additionalInfo",
  string
>;

export type WizardData = {
  countries: { slug: string; name: string; iso: string; region: string; visaTypes: { code: string; name: string }[]; questions: Q[]; checklist: CL[] }[];
  globalQuestions: Q[];
  packages: { slug: string; name: string; description: string; price: number; features: string[]; countrySlugs: string[]; highlighted: boolean }[];
  user: { email: string; firstName: string; lastName: string; phone: string; city: string } | null;
  initial: { country: string; visaType: string; package: string };
  whatsappNumber: string;
  draft: { id: string; country: string; visaType: string; details: Details; answers: Record<string, string>; documents: Doc[] } | null;
};

type T = {
  apply: Dictionary["apply"];
  common: Dictionary["common"];
  auth: Dictionary["auth"];
  regions: Dictionary["regions"];
  country: Dictionary["country"];
  legal: { terms: string; privacy: string; refunds: string };
};

const STEP_KEYS = ["destination", "visaType", "details", "questions", "checklist", "documents", "package", "review"] as const;

function fmtMAD(n: number, locale: string) {
  const s = new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB", { maximumFractionDigits: 2 }).format(n);
  return locale === "ar" ? `${s} د.م.` : `${s} MAD`;
}

export function ApplyWizard({ locale, data, t }: { locale: string; data: WizardData; t: T }) {
  const d0 = data.draft;
  const [step, setStep] = useState(d0 ? 4 : data.initial.country && data.countries.some((c) => c.slug === data.initial.country) ? 1 : 0);
  const [country, setCountry] = useState(d0?.country || data.initial.country || "");
  const [visaType, setVisaType] = useState(d0?.visaType || data.initial.visaType || "");
  const [details, setDetails] = useState<Details>(
    d0?.details || {
      firstName: data.user?.firstName || "", lastName: data.user?.lastName || "", email: data.user?.email || "", phone: data.user?.phone || "",
      dateOfBirth: "", nationality: locale === "ar" ? "مغربية" : locale === "fr" ? "Marocaine" : "Moroccan", passportNumber: "", passportExpiry: "",
      city: data.user?.city || "", purpose: "", departureDate: "", returnDate: "", travelers: "1", additionalInfo: "",
    },
  );
  const [answers, setAnswers] = useState<Record<string, string>>(d0?.answers || {});
  const [user, setUser] = useState(data.user);
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(d0?.id || null);
  const [savedChecklist, setSavedChecklist] = useState<{ id: string; title: string; description: string; required: boolean }[]>([]);
  const [docs, setDocs] = useState<Doc[]>(d0?.documents || []);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pkg, setPkg] = useState(data.initial.package || "");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [codeError, setCodeError] = useState(false);
  const [consents, setConsents] = useState({ terms: false, data: false, independent: false, whatsapp: false });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [result, setResult] = useState<{ reference: string; applicationId: string } | null>(null);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("");

  const c = data.countries.find((x) => x.slug === country);
  const questions = useMemo(
    () => [...data.globalQuestions, ...(c?.questions || [])].filter((q) => !q.visaTypeCodes.length || q.visaTypeCodes.includes(visaType)),
    [data.globalQuestions, c, visaType],
  );
  const previewChecklist = useMemo(() => (c ? buildChecklist(c.checklist, visaType || null, answers) : []), [c, visaType, answers]) as unknown as CL[];
  const availablePackages = data.packages.filter((p) => !p.countrySlugs.length || p.countrySlugs.includes(country));
  const selectedPkg = availablePackages.find((p) => p.slug === pkg);
  const total = selectedPkg ? Math.max(0, selectedPkg.price - (discount?.amount || 0)) : 0;

  const fe = (k: string) => fieldErrors[k]?.[0];
  const setD = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setDetails((s) => ({ ...s, [k]: e.target.value }));

  function go(n: number) {
    setError(null);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateDetails() {
    const errs: Record<string, string[]> = {};
    for (const k of ["firstName", "lastName", "email", "phone"] as const) if (!details[k].trim()) errs[k] = [t.common.required];
    if (details.email && !/^\S+@\S+\.\S+$/.test(details.email)) errs.email = [t.common.invalidForm];
    if (!user) {
      if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) errs.password = [t.apply.errors.weakPassword];
      if (!acceptTerms) errs.acceptTerms = [t.apply.errors.consent];
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError(t.common.invalidForm);
      return false;
    }
    return true;
  }

  function validateQuestions() {
    const errs: Record<string, string[]> = {};
    for (const q of questions) if (q.required && !answers[q.key]) errs[`answers.${q.key}`] = [t.common.required];
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError(t.common.invalidForm);
      return false;
    }
    return true;
  }

  function saveDraft() {
    start(async () => {
      const res = await saveDraftAction(locale, { draftId: draftId || undefined, country, visaType: visaType || undefined, ...details, answers, password: user ? undefined : password, acceptTerms });
      if (!res.ok) {
        setError(res.error || t.common.error);
        setFieldErrors(res.fieldErrors || {});
        const keys = Object.keys(res.fieldErrors || {});
        if (keys.some((k) => !k.startsWith("answers."))) setStep(2);
        else if (keys.length) setStep(3);
        return;
      }
      setDraftId(String(res.data!.applicationId));
      setSavedChecklist(res.data!.checklist as typeof savedChecklist);
      if (!user) setUser({ email: details.email, firstName: details.firstName, lastName: details.lastName, phone: details.phone, city: details.city });
      go(5);
    });
  }

  async function upload(file: File, item: { id: string | null; label: string }) {
    if (!draftId) return;
    setUploading(item.id || "other");
    setError(null);
    const fd = new FormData();
    fd.set("applicationId", draftId);
    fd.set("file", file);
    fd.set("label", item.label);
    if (item.id) fd.set("checklistItemId", item.id);
    const res = await uploadDocumentAction(locale, fd);
    setUploading(null);
    if (!res.ok) setError(res.error || t.common.error);
    else setDocs((d) => [...d, res.data as Doc]);
  }

  function applyCode() {
    setCodeError(false);
    start(async () => {
      const r = await checkDiscountAction(code, pkg);
      if (r.ok && r.amount) setDiscount({ code: code.trim().toUpperCase(), amount: r.amount });
      else {
        setDiscount(null);
        setCodeError(true);
      }
    });
  }

  function submit() {
    if (!consents.terms || !consents.data || !consents.independent) {
      setError(t.apply.errors.consent);
      return;
    }
    start(async () => {
      const res = await submitApplicationAction(locale, {
        applicationId: draftId!,
        packageSlug: pkg || undefined,
        discountCode: discount?.code,
        consentTerms: true,
        consentData: true,
        consentIndependent: true,
        consentWhatsapp: consents.whatsapp,
      });
      if (!res.ok) setError(res.error || t.common.error);
      else {
        setResult(res.data as { reference: string; applicationId: string });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (result) {
    const waMsg = t.apply.whatsappApplyMessage.replace("{reference}", result.reference);
    return (
      <Card className="mt-8 animate-fade-up p-8 text-center sm:p-12">
        <PartyPopper className="mx-auto h-12 w-12 text-gold-500" />
        <h2 className="mt-4 font-display text-3xl font-semibold text-navy-800">{t.apply.successTitle}</h2>
        <p className="mt-4 text-slate-600">{t.apply.successText}</p>
        <p className="mt-2 inline-block rounded-xl bg-navy-800 px-6 py-3 font-mono text-2xl font-bold tracking-wider text-gold-400" data-testid="reference">{result.reference}</p>
        <p className="mx-auto mt-6 max-w-xl text-sm text-slate-600">{t.apply.successNext}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/account/applications/${result.applicationId}`} className="inline-flex h-12 items-center rounded-lg bg-gold-500 px-6 font-semibold text-navy-900 hover:bg-gold-400">
            {t.apply.goToDashboard}
          </Link>
          {data.whatsappNumber && (
            <a href={`https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#25D366] px-6 font-semibold text-white">
              <WhatsAppIcon className="h-5 w-5" /> {t.apply.sendWhatsapp}
            </a>
          )}
        </div>
        <p className="mt-8 text-xs text-slate-400">{t.common.independentNotice}</p>
      </Card>
    );
  }

  const checklistToShow = step >= 5 && savedChecklist.length ? savedChecklist : previewChecklist.map((i) => ({ id: i.id, title: i.title, description: i.description, required: i.required }));
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  return (
    <div className="mt-8">
      {/* Stepper */}
      <ol className="mb-8 flex gap-1 overflow-x-auto pb-2" aria-label="Progress">
        {STEP_KEYS.map((k, i) => (
          <li key={k} className="flex min-w-[88px] flex-1 flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-navy-800 text-gold-400 ring-4 ring-navy-100" : "bg-slate-200 text-slate-500",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("text-[11px] font-medium", i === step ? "text-navy-800" : "text-slate-500")}>{t.apply.steps[k]}</span>
          </li>
        ))}
      </ol>

      <Card className="p-5 sm:p-8">
        {error && <Alert tone="error" className="mb-6">{error}</Alert>}

        {step === 0 && (
          <div>
            <h2 className="text-xl font-semibold text-navy-800">{t.apply.chooseDestination}</h2>
            <div className="relative mt-4 max-w-sm">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="ps-9" placeholder={t.common.search} aria-label={t.common.search} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {data.countries
                .filter((x) => !filter || norm(x.name).includes(norm(filter)))
                .map((x) => (
                  <button
                    key={x.slug}
                    type="button"
                    onClick={() => {
                      setCountry(x.slug);
                      if (x.slug !== country) setVisaType("");
                      go(1);
                    }}
                    className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-start text-sm font-medium transition hover:border-gold-400 hover:bg-gold-50", country === x.slug ? "border-gold-500 bg-gold-50 ring-1 ring-gold-400" : "border-slate-200")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/flags/${x.iso}.svg`} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                    <span className="truncate">{x.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {step === 1 && c && (
          <div>
            <h2 className="text-xl font-semibold text-navy-800">{t.apply.chooseVisaType} — {c.name}</h2>
            {!c.visaTypes.length && <p className="mt-2 text-sm text-slate-500">{t.apply.noVisaTypes}</p>}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...c.visaTypes, { code: "", name: t.apply.otherVisa }].map((v) => (
                <button
                  key={v.code || "other"}
                  type="button"
                  onClick={() => {
                    setVisaType(v.code);
                    go(2);
                  }}
                  className={cn("flex items-center justify-between rounded-xl border p-4 text-start font-medium transition hover:border-gold-400 hover:bg-gold-50", visaType === v.code ? "border-gold-500 bg-gold-50" : "border-slate-200")}
                >
                  {v.name}
                  <ArrowRight className="rtl-flip h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <fieldset>
              <legend className="text-xl font-semibold text-navy-800">{t.apply.personalInfo}</legend>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t.apply.firstName} required error={fe("firstName")}><Input value={details.firstName} onChange={setD("firstName")} autoComplete="given-name" /></Field>
                <Field label={t.apply.lastName} required error={fe("lastName")}><Input value={details.lastName} onChange={setD("lastName")} autoComplete="family-name" /></Field>
                <Field label={t.common.email} required error={fe("email")}><Input type="email" dir="ltr" value={details.email} onChange={setD("email")} disabled={Boolean(user)} autoComplete="email" /></Field>
                <Field label={t.common.phone} required error={fe("phone")}><Input type="tel" dir="ltr" value={details.phone} onChange={setD("phone")} placeholder="06 XX XX XX XX" autoComplete="tel" /></Field>
                <Field label={t.apply.dateOfBirth} error={fe("dateOfBirth")}><Input type="date" value={details.dateOfBirth} onChange={setD("dateOfBirth")} /></Field>
                <Field label={t.apply.nationality}><Input value={details.nationality} onChange={setD("nationality")} /></Field>
                <Field label={t.apply.passportNumber}><Input dir="ltr" value={details.passportNumber} onChange={setD("passportNumber")} className="uppercase" /></Field>
                <Field label={t.apply.passportExpiry}><Input type="date" value={details.passportExpiry} onChange={setD("passportExpiry")} /></Field>
                <Field label={t.apply.city}><Input value={details.city} onChange={setD("city")} /></Field>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xl font-semibold text-navy-800">{t.apply.travelInfo}</legend>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t.apply.departureDate}><Input type="date" value={details.departureDate} onChange={setD("departureDate")} /></Field>
                <Field label={t.apply.returnDate}><Input type="date" value={details.returnDate} onChange={setD("returnDate")} /></Field>
                <Field label={t.apply.travelers}><Input type="number" min={1} max={20} value={details.travelers} onChange={setD("travelers")} /></Field>
                <Field label={t.apply.purpose} className="sm:col-span-3"><Input value={details.purpose} onChange={setD("purpose")} maxLength={300} /></Field>
                <Field label={t.apply.additionalInfo} className="sm:col-span-3"><Textarea value={details.additionalInfo} onChange={setD("additionalInfo")} maxLength={2000} rows={3} /></Field>
              </div>
            </fieldset>
            <fieldset className="rounded-xl border border-navy-100 bg-navy-50/50 p-5">
              <legend className="px-1 font-semibold text-navy-800">{t.apply.accountTitle}</legend>
              {user ? (
                <p className="text-sm text-slate-600">{t.apply.loggedInAs.replace("{email}", user.email)}</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {t.apply.accountText} {t.apply.haveAccount}{" "}
                    <Link className="font-semibold text-navy-700 underline" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/apply?country=${country}`)}`}>{t.auth.loginButton}</Link>
                  </p>
                  <Field label={t.apply.password} required hint={t.apply.passwordHint} error={fe("password")} className="max-w-sm">
                    <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Checkbox
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    label={<>{t.auth.acceptPrivacy} (<a className="underline" target="_blank" href={`/${locale}/legal/terms`}>{t.legal.terms}</a>, <a className="underline" target="_blank" href={`/${locale}/legal/privacy`}>{t.legal.privacy}</a>)</>}
                  />
                  {fe("acceptTerms") && <p className="text-xs text-red-600">{fe("acceptTerms")}</p>}
                </div>
              )}
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-navy-800">{t.apply.questionsTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.apply.questionsText}</p>
            {!questions.length && <p className="mt-4 text-slate-500">{t.apply.noQuestions}</p>}
            <div className="mt-6 space-y-5">
              {questions.map((q) => (
                <Field key={q.key} label={q.label} required={q.required} hint={q.help || undefined} error={fe(`answers.${q.key}`)}>
                  {q.type === "YES_NO" ? (
                    <div className="flex gap-2">
                      {(["yes", "no"] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.key]: v }))} className={cn("h-10 min-w-[90px] rounded-lg border px-4 text-sm font-medium transition", answers[q.key] === v ? "border-navy-800 bg-navy-800 text-white" : "border-slate-300 bg-white hover:border-navy-400")} aria-pressed={answers[q.key] === v}>
                          {t.common.yesNo[v]}
                        </button>
                      ))}
                    </div>
                  ) : q.type === "SELECT" ? (
                    <Select value={answers[q.key] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}>
                      <option value="">—</option>
                      {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : (
                    <Input type={q.type === "NUMBER" ? "number" : q.type === "DATE" ? "date" : "text"} value={answers[q.key] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} maxLength={500} />
                  )}
                </Field>
              ))}
            </div>
          </div>
        )}

        {(step === 4 || step === 5) && (
          <div>
            <h2 className="text-xl font-semibold text-navy-800">{step === 4 ? t.apply.checklistTitle : t.apply.documentsTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{step === 4 ? t.apply.checklistText : t.apply.documentsText}</p>
            {!checklistToShow.length && <p className="mt-4 text-slate-500">{t.apply.checklistEmpty}</p>}
            <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {checklistToShow.map((i) => {
                const uploaded = docs.filter((d) => d.checklistItemId === i.id);
                return (
                  <li key={i.id} className="flex flex-wrap items-start gap-3 p-4">
                    {uploaded.length ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy-800">
                        {i.title} <span className="text-xs font-normal text-slate-400">· {i.required ? t.country.requiredDoc : t.country.conditionalDoc}</span>
                      </p>
                      {i.description && <p className="text-sm text-slate-500">{i.description}</p>}
                      {uploaded.map((u) => <p key={u.id} className="mt-1 text-xs text-emerald-700">✓ {t.apply.uploaded}: {u.name}</p>)}
                    </div>
                    {step === 5 && (
                      <label className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-navy-200 px-3 text-sm font-medium text-navy-800 hover:bg-navy-50", uploading && "pointer-events-none opacity-60")}>
                        {uploading === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                        {t.apply.uploadFor}
                        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, { id: i.id, label: i.title }); e.target.value = ""; }} />
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
            {step === 4 && <p className="mt-4 text-xs text-slate-500">{t.country.officialLinksNote}</p>}
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="text-xl font-semibold text-navy-800">{t.apply.packageTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.apply.packageText}</p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {availablePackages.map((p) => (
                <button key={p.slug} type="button" onClick={() => { setPkg(p.slug); setDiscount(null); }} className={cn("flex flex-col rounded-2xl border p-5 text-start transition", pkg === p.slug ? "border-gold-500 bg-gold-50 ring-2 ring-gold-400" : "border-slate-200 hover:border-gold-300")} aria-pressed={pkg === p.slug}>
                  <span className="font-semibold text-navy-800">{p.name}</span>
                  <span className="mt-1 text-2xl font-bold text-navy-800">{fmtMAD(p.price, locale)}</span>
                  <span className="mt-1 text-xs text-slate-500">{p.description}</span>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {p.features.map((f) => <li key={f} className="flex gap-1.5"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{f}</li>)}
                  </ul>
                </button>
              ))}
            </div>
            {pkg && (
              <div className="mt-6 flex flex-wrap items-end gap-2">
                <Field label={t.apply.discountCode} className="w-48"><Input value={code} onChange={(e) => setCode(e.target.value)} className="uppercase" /></Field>
                <Button type="button" variant="outline" onClick={applyCode} disabled={!code || pending}><Tag className="h-4 w-4" />{t.apply.applyCode}</Button>
                {discount && <p className="w-full text-sm font-medium text-emerald-700">{t.apply.codeApplied.replace("{amount}", fmtMAD(discount.amount, locale))}</p>}
                {codeError && <p className="w-full text-sm text-red-600">{t.apply.codeInvalid}</p>}
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy-800">{t.apply.reviewTitle}</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">{t.apply.steps.destination}</dt><dd className="font-medium">{c?.name}</dd></div>
              <div><dt className="text-slate-500">{t.apply.steps.visaType}</dt><dd className="font-medium">{c?.visaTypes.find((v) => v.code === visaType)?.name || t.apply.otherVisa}</dd></div>
              <div><dt className="text-slate-500">{t.common.name}</dt><dd className="font-medium">{details.firstName} {details.lastName}</dd></div>
              <div><dt className="text-slate-500">{t.common.email}</dt><dd className="font-medium" dir="ltr">{details.email}</dd></div>
              <div><dt className="text-slate-500">{t.apply.steps.documents}</dt><dd className="font-medium">{docs.length}</dd></div>
              <div><dt className="text-slate-500">{t.apply.steps.package}</dt><dd className="font-medium">{selectedPkg?.name || "—"}</dd></div>
            </dl>
            {selectedPkg && (
              <div className="rounded-xl border border-slate-200 p-5 text-sm">
                <div className="flex justify-between"><span>{t.apply.subtotal}</span><span>{fmtMAD(selectedPkg.price, locale)}</span></div>
                {discount && <div className="flex justify-between text-emerald-700"><span>{t.apply.discount} ({discount.code})</span><span>−{fmtMAD(discount.amount, locale)}</span></div>}
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-navy-800"><span>{t.apply.totalDue}</span><span>{fmtMAD(total, locale)}</span></div>
                <p className="mt-2 text-xs text-slate-500">{t.country.ourPricesNote}</p>
              </div>
            )}
            <div className="space-y-3">
              <Checkbox checked={consents.terms} onChange={(e) => setConsents((s) => ({ ...s, terms: e.target.checked }))} label={<>{t.apply.consentTerms} (<a className="underline" target="_blank" href={`/${locale}/legal/terms`}>{t.legal.terms}</a> · <a className="underline" target="_blank" href={`/${locale}/legal/refunds`}>{t.legal.refunds}</a>)</>} />
              <Checkbox checked={consents.data} onChange={(e) => setConsents((s) => ({ ...s, data: e.target.checked }))} label={<>{t.apply.consentData} (<a className="underline" target="_blank" href={`/${locale}/legal/privacy`}>{t.legal.privacy}</a>)</>} />
              <Checkbox checked={consents.independent} onChange={(e) => setConsents((s) => ({ ...s, independent: e.target.checked }))} label={t.apply.consentIndependent} />
              <Checkbox checked={consents.whatsapp} onChange={(e) => setConsents((s) => ({ ...s, whatsapp: e.target.checked }))} label={<>{t.apply.consentWhatsapp} <span className="text-slate-400">({t.common.optional})</span></>} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          {step > 0 && step !== 5 ? (
            <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={pending}><ArrowLeft className="rtl-flip h-4 w-4" />{t.common.previous}</Button>
          ) : step === 5 ? (
            <Button type="button" variant="ghost" onClick={() => go(4)} disabled={pending}><ArrowLeft className="rtl-flip h-4 w-4" />{t.common.previous}</Button>
          ) : <span />}
          {step === 2 && <Button type="button" variant="navy" onClick={() => validateDetails() && go(3)}>{t.common.next}<ArrowRight className="rtl-flip h-4 w-4" /></Button>}
          {step === 3 && <Button type="button" variant="navy" onClick={() => validateQuestions() && go(4)}>{t.common.next}<ArrowRight className="rtl-flip h-4 w-4" /></Button>}
          {step === 4 && <Button type="button" variant="navy" onClick={saveDraft} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{t.apply.saveAndContinue}<ArrowRight className="rtl-flip h-4 w-4" /></Button>}
          {step === 5 && <Button type="button" variant="navy" onClick={() => go(6)} disabled={Boolean(uploading)}>{docs.length ? t.common.next : t.apply.uploadLater}<ArrowRight className="rtl-flip h-4 w-4" /></Button>}
          {step === 6 && <Button type="button" variant="navy" onClick={() => go(7)}>{t.common.next}<ArrowRight className="rtl-flip h-4 w-4" /></Button>}
          {step === 7 && <Button type="button" size="lg" onClick={submit} disabled={pending} data-testid="submit-application">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{t.apply.submitApplication}</Button>}
        </div>
      </Card>
      <p className="mt-6 text-center text-xs text-slate-500">{t.common.independentNotice}</p>
    </div>
  );
}
