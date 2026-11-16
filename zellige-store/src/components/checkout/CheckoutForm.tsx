"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, Building2, CreditCard, Loader2, Lock, Tag } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { useCart, useStore } from "../providers";
import { useQuote } from "../cart/useQuote";
import type { I18nText } from "@/lib/i18n/config";
import { formatMoney, MAD } from "@/lib/money";

type City = { id: string; name: I18nText; fee: number; region: string | null };
type Prefill = { email?: string; phone?: string | null; name?: string; city?: string | null; address?: string | null; country?: string | null };

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-7">
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-majorelle font-sans text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = { COD: Banknote, BANK_TRANSFER: Building2, CMI: CreditCard, STRIPE: CreditCard };

export function CheckoutForm({ cities, countries, prefill, loggedIn }: { cities: City[]; countries: { code: string; name: string }[]; prefill: Prefill; loggedIn: boolean }) {
  const { d, money, t, href, locale, currency } = useStore();
  const { lines, ready, clear } = useCart();
  const router = useRouter();
  const [first, ...rest] = (prefill.name || "").split(" ");
  const [f, setF] = useState({
    email: prefill.email || "",
    phone: prefill.phone || "",
    firstName: first || "",
    lastName: rest.join(" "),
    country: prefill.country && countries.some((c) => c.code === prefill.country) ? prefill.country : "MA",
    cityId: "",
    cityName: "",
    address: prefill.address || "",
    postalCode: "",
    notes: "",
    password: "",
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMa = f.country === "MA";

  useEffect(() => {
    if (prefill.city && isMa) {
      const match = cities.find((c) => Object.values(c.name).some((n) => n?.toLowerCase() === prefill.city!.toLowerCase()));
      setF((s) => ({ ...s, cityId: match ? match.id : "other", cityName: match ? "" : prefill.city! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { quote, loading } = useQuote({ country: f.country, cityId: isMa ? f.cityId || null : null, code });
  const methods = useMemo(() => quote?.paymentMethods ?? [], [quote]);
  useEffect(() => {
    if (methods.length && (!method || !methods.includes(method))) setMethod(methods[0]);
  }, [methods, method]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const shippingOk = !!quote?.shipping && quote.shipping.available && (!isMa || !!f.cityId);
  const problems = quote?.lines.some((l) => l.status !== "ok");
  const cityLabel = isMa ? (f.cityId === "other" ? f.cityName : t(cities.find((c) => c.id === f.cityId)?.name)) : f.cityName;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || !method) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
          country: f.country,
          cityId: isMa ? f.cityId : null,
          cityName: cityLabel,
          code,
          paymentMethod: method,
          email: f.email,
          phone: f.phone,
          firstName: f.firstName,
          lastName: f.lastName,
          address: f.address,
          postalCode: f.postalCode || undefined,
          notes: f.notes || undefined,
          locale,
          currency: currency.code,
          expectedTotal: quote.totals.total,
          createAccount: !loggedIn && createAccount,
          password: createAccount ? f.password : undefined,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; redirect?: string; error?: string };
      if (j.ok && j.redirect) {
        clear();
        if (j.redirect.startsWith("http")) window.location.href = j.redirect;
        else router.push(j.redirect);
        return;
      }
      setError(
        j.error === "STOCK" || j.error === "CHANGED" ? d.cart.adjusted
        : j.error === "DISCOUNT" ? d.checkout.codeInvalid
        : j.error === "NO_SHIPPING" ? d.checkout.noShippingToCountry
        : j.error === "rate" ? d.account.tooMany
        : d.common.error,
      );
    } catch {
      setError(d.common.error);
    }
    setSubmitting(false);
  };

  if (ready && !lines.length)
    return (
      <div className="card p-10 text-center">
        <p>{d.cart.empty}</p>
        <Link href={href("/shop")} className="btn-primary mt-5">{d.cart.continue}</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {!loggedIn && (
          <p className="text-sm text-charcoal-600">
            {d.checkout.guestNote}{" "}
            <Link href={href(`/account/login?next=${encodeURIComponent(href("/checkout"))}`)} className="link font-semibold text-majorelle">{d.checkout.signIn}</Link>
          </p>
        )}
        <Section n={1} title={d.checkout.contact}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">{d.checkout.email}</span><input type="email" required autoComplete="email" value={f.email} onChange={set("email")} className="field" /></label>
            <label className="block">
              <span className="label">{d.checkout.phone}</span>
              <input type="tel" required autoComplete="tel" inputMode="tel" dir="ltr" placeholder="06 12 34 56 78" value={f.phone} onChange={set("phone")} className="field text-start" />
              <span className="mt-1 block text-xs text-charcoal-500">{d.checkout.phoneHint}</span>
            </label>
          </div>
        </Section>

        <Section n={2} title={d.checkout.delivery}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">{d.checkout.firstName}</span><input required autoComplete="given-name" value={f.firstName} onChange={set("firstName")} className="field" /></label>
            <label className="block"><span className="label">{d.checkout.lastName}</span><input required autoComplete="family-name" value={f.lastName} onChange={set("lastName")} className="field" /></label>
            <label className="block sm:col-span-2">
              <span className="label">{d.checkout.country}</span>
              <select value={f.country} onChange={(e) => setF((s) => ({ ...s, country: e.target.value, cityId: "", cityName: "" }))} autoComplete="country" className="field">
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
            {isMa ? (
              <>
                <label className="block sm:col-span-2">
                  <span className="label">{d.checkout.city}</span>
                  <select required value={f.cityId} onChange={set("cityId")} className="field">
                    <option value="" disabled>{d.checkout.chooseCity}</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{t(c.name)} · {formatMoney(c.fee, locale, MAD)}</option>)}
                    <option value="other">{d.checkout.otherCity}</option>
                  </select>
                </label>
                {f.cityId === "other" && (
                  <label className="block sm:col-span-2"><span className="label">{d.checkout.cityName}</span><input required minLength={2} value={f.cityName} onChange={set("cityName")} autoComplete="address-level2" className="field" /></label>
                )}
              </>
            ) : (
              <>
                <label className="block"><span className="label">{d.checkout.city}</span><input required minLength={2} value={f.cityName} onChange={set("cityName")} autoComplete="address-level2" className="field" /></label>
                <label className="block"><span className="label">{d.checkout.postalCode}</span><input value={f.postalCode} onChange={set("postalCode")} autoComplete="postal-code" className="field" /></label>
              </>
            )}
            <label className="block sm:col-span-2">
              <span className="label">{d.checkout.address}</span>
              <input required minLength={4} value={f.address} onChange={set("address")} autoComplete="street-address" placeholder={d.checkout.addressHint} className="field" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">{d.checkout.notes}</span>
              <textarea rows={2} maxLength={1000} value={f.notes} onChange={set("notes")} placeholder={d.checkout.notesHint} className="field" />
            </label>
          </div>
          {quote?.shipping && !quote.shipping.available && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-terracotta-50 p-4 text-sm text-terracotta-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{d.checkout.noShippingToCountry}</p>
          )}
          {shippingOk && quote?.shipping?.available && (
            <p className="mt-4 text-sm text-emerald-700">{d.checkout.deliveryEstimate.replace("{min}", String(quote.shipping.minDays)).replace("{max}", String(quote.shipping.maxDays))}</p>
          )}
        </Section>

        <Section n={3} title={d.checkout.payment}>
          {methods.length === 0 ? (
            <p className="text-sm text-charcoal-500">{loading ? d.common.loading : d.checkout.noShippingToCountry}</p>
          ) : (
            <div className="space-y-3" role="radiogroup" aria-label={d.checkout.payment}>
              {methods.map((m) => {
                const Icon = METHOD_ICON[m];
                return (
                  <label key={m} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${method === m ? "border-majorelle bg-majorelle-50" : "border-charcoal/15 hover:border-charcoal/30"}`}>
                    <input type="radio" name="payment" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-majorelle" />
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-majorelle" />
                    <span>
                      <span className="block font-semibold">{d.checkout.methods[m]}</span>
                      <span className="mt-0.5 block text-sm text-charcoal-600">{d.checkout.methodsHelp[m]}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {!loggedIn && (
            <div className="mt-6 border-t border-charcoal/10 pt-5">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="h-4 w-4 accent-majorelle" />
                {d.checkout.createAccount}
              </label>
              {createAccount && (
                <label className="mt-3 block max-w-sm"><span className="label">{d.checkout.password}</span><input type="password" minLength={8} required autoComplete="new-password" value={f.password} onChange={set("password")} className="field" /><span className="mt-1 block text-xs text-charcoal-500">{d.account.passwordHint}</span></label>
              )}
            </div>
          )}
        </Section>
      </div>

      <aside className="h-fit lg:sticky lg:top-28">
        <div className="card p-5 md:p-6">
          <h2 className="mb-4 font-display text-2xl font-semibold">{d.checkout.summary}</h2>
          <ul className="max-h-72 space-y-4 overflow-y-auto">
            {(quote?.lines ?? []).map((l) => (
              <li key={l.key} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ivory-200">
                  {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-bold text-white">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-medium">{t(l.name)}</p>
                  {l.variantName && <p className="text-xs text-charcoal-500">{t(l.variantName)}</p>}
                  {l.status !== "ok" && <p className="text-xs text-terracotta">{l.status === "unavailable" ? d.cart.unavailable : d.cart.adjusted}</p>}
                </div>
                <p className="text-sm font-medium">{money(l.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-charcoal/10 pt-5">
            <label className="label" htmlFor="code">{d.checkout.discountCode}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                <input id="code" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} className="field py-2.5 ps-9 uppercase" autoComplete="off" />
              </div>
              <button type="button" onClick={() => setCode(codeInput.trim() || null)} className="btn-outline btn-sm">{d.checkout.applyCode}</button>
            </div>
            {quote?.discount && <p className={`mt-2 text-xs ${quote.discount.ok ? "text-emerald-700" : "text-terracotta"}`}>{quote.discount.ok ? `${d.checkout.codeApplied}: ${quote.discount.code}` : d.checkout.codeInvalid}</p>}
          </div>

          <dl className={`mt-5 space-y-2 border-t border-charcoal/10 pt-5 text-sm ${loading ? "opacity-60" : ""}`}>
            <div className="flex justify-between"><dt>{d.cart.subtotal}</dt><dd>{money(quote?.totals.subtotal ?? 0)}</dd></div>
            {!!quote?.totals.discount && <div className="flex justify-between text-emerald-700"><dt>{d.cart.discount}</dt><dd>−{money(quote.totals.discount)}</dd></div>}
            <div className="flex justify-between">
              <dt>{d.cart.shipping}{quote?.shipping?.available && quote.shipping.label ? ` · ${quote.shipping.label}` : ""}</dt>
              <dd>{!shippingOk ? "—" : quote!.totals.freeShipping ? d.checkout.freeShipping : money(quote!.totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-charcoal/10 pt-3 text-lg font-semibold"><dt>{d.cart.total}</dt><dd>{money(quote?.totals.total ?? 0)}</dd></div>
          </dl>
          {currency.code !== "MAD" && quote && (
            <p className="mt-2 text-xs text-charcoal-500">
              {method === "STRIPE" ? d.checkout.chargedIn.replace("{amount}", money(quote.totals.total)) : `${d.checkout.chargedInMad} ${formatMoney(quote.totals.total, locale, MAD)}`}
            </p>
          )}

          {error && <p className="mt-4 rounded-xl bg-terracotta-50 p-3 text-sm text-terracotta-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting || loading || !quote || !method || !shippingOk || !!problems} className="btn-primary mt-5 w-full py-4 text-base">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{d.checkout.placing}</> : <><Lock className="h-4 w-4" />{method === "CMI" || method === "STRIPE" ? d.checkout.payNow : d.checkout.placeOrder}</>}
          </button>
          <p className="mt-3 text-center text-xs text-charcoal-500">
            {d.checkout.terms.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
              part === "{terms}" ? <Link key={i} href={href("/pages/terms")} className="link">{d.checkout.termsLink}</Link>
              : part === "{privacy}" ? <Link key={i} href={href("/pages/privacy")} className="link">{d.checkout.privacyLink}</Link>
              : part,
            )}
          </p>
        </div>
      </aside>
    </form>
  );
}
