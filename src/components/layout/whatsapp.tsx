"use client";
import { useEffect, useSyncExternalStore } from "react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { toWhatsAppNumber } from "@/lib/utils";

// Tiny global store so any page can set the pre-filled WhatsApp message (service, reference…).
let current: string | null = null;
const listeners = new Set<() => void>();
function setMessage(m: string | null) {
  current = m;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function SetWhatsAppMessage({ text }: { text: string }) {
  useEffect(() => {
    setMessage(text);
    return () => setMessage(null);
  }, [text]);
  return null;
}

export function WhatsAppFloat({ number, defaultMessage, label }: { number: string; defaultMessage: string; label: string }) {
  const msg = useSyncExternalStore(subscribe, () => current, () => null);
  const n = toWhatsAppNumber(number);
  if (!n) return null;
  const href = `https://wa.me/${n}?text=${encodeURIComponent(msg || defaultMessage)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="no-print group fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-premium transition hover:scale-105 hover:bg-[#1ebe5b] sm:bottom-6 sm:end-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pe-1 sm:inline">{label}</span>
      <span className="absolute -top-0.5 end-0.5 h-3 w-3 animate-ping rounded-full bg-[#25D366] opacity-60" aria-hidden />
    </a>
  );
}
