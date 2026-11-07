"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

type Consent = { analytics: boolean; v: number; at: string };
const COOKIE = "va_consent";

function readConsent(): Consent | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

function writeConsent(analytics: boolean) {
  const c: Consent = { analytics, v: 1, at: new Date().toISOString() };
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(c))}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  return c;
}

type Labels = { title: string; text: string; acceptAll: string; rejectAll: string; customize: string; essential: string; analytics: string; save: string; policy: string };

export function CookieConsent({ labels, policyHref, gaId }: { labels: Labels; policyHref: string; gaId?: string }) {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    const open = () => {
      setConsent(null);
      setCustom(true);
    };
    window.addEventListener("va:open-cookie-settings", open);
    return () => window.removeEventListener("va:open-cookie-settings", open);
  }, []);

  const loadGa = Boolean(gaId && consent?.analytics);

  return (
    <>
      {loadGa && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent === null && (
        <div role="dialog" aria-live="polite" aria-label={labels.title} className="no-print fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-premium sm:inset-x-6 sm:bottom-6">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-gold-600" aria-hidden />
            <div className="flex-1">
              <p className="font-semibold text-navy-800">{labels.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {labels.text}{" "}
                <a href={policyHref} className="font-medium text-navy-700 underline">
                  {labels.policy}
                </a>
              </p>
              {custom && (
                <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <label className="flex items-center gap-2 text-slate-500">
                    <input type="checkbox" checked disabled className="accent-navy-800" /> {labels.essential}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="accent-navy-800" /> {labels.analytics}
                  </label>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="navy" onClick={() => setConsent(writeConsent(true))}>
                  {labels.acceptAll}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConsent(writeConsent(false))}>
                  {labels.rejectAll}
                </Button>
                {custom ? (
                  <Button size="sm" variant="ghost" onClick={() => setConsent(writeConsent(analytics))}>
                    {labels.save}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setCustom(true)}>
                    {labels.customize}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("va:open-cookie-settings"))} className="hover:text-white">
      {label}
    </button>
  );
}
