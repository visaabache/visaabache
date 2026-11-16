import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Dict, Locale } from "@/lib/i18n";
import type { StoreSettings } from "@/lib/settings";
import { StarMark, ZelligePattern } from "../ui/Zellige";
import { NewsletterForm } from "./NewsletterForm";

const social = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "pinterest", label: "Pinterest" },
] as const;

export function Footer({ locale, d, store }: { locale: Locale; d: Dict; store: StoreSettings }) {
  const h = (p: string) => `/${locale}${p}`;
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-charcoal text-ivory">
      <div className="relative overflow-hidden border-b border-white/10">
        <ZelligePattern color="#D6A23A" opacity={0.07} />
        <div className="container relative grid gap-8 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">{d.newsletter.title}</h2>
            <p className="mt-2 max-w-md text-sm text-ivory/70">{d.newsletter.text}</p>
          </div>
          <NewsletterForm />
        </div>
      </div>
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={h("")} className="flex items-center gap-2.5">
            <StarMark className="h-9 w-9" />
            <span className="font-display text-2xl font-semibold">{store.name}</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-ivory/70">{d.footer.about}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {social.map((s) =>
              store[s.key] ? (
                <a key={s.key} href={store[s.key]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white hover:text-charcoal">
                  {s.label}
                </a>
              ) : null,
            )}
          </div>
        </div>
        <FooterCol title={d.footer.shop}>
          <FooterLink href={h("/shop")}>{d.nav.allProducts}</FooterLink>
          <FooterLink href={h("/collections")}>{d.nav.collections}</FooterLink>
          <FooterLink href={h("/gifts")}>{d.nav.gifts}</FooterLink>
          <FooterLink href={h("/craftsmanship")}>{d.nav.craft}</FooterLink>
        </FooterCol>
        <FooterCol title={d.footer.help}>
          <FooterLink href={h("/track")}>{d.nav.track}</FooterLink>
          <FooterLink href={h("/pages/shipping")}>{d.footer.shipping}</FooterLink>
          <FooterLink href={h("/pages/returns")}>{d.footer.returns}</FooterLink>
          <FooterLink href={h("/pages/terms")}>{d.footer.terms}</FooterLink>
          <FooterLink href={h("/pages/privacy")}>{d.footer.privacy}</FooterLink>
          <FooterLink href={h("/pages/legal")}>{d.footer.legal}</FooterLink>
        </FooterCol>
        <FooterCol title={d.footer.contact}>
          {store.phone && (
            <li className="flex items-center gap-2 text-sm text-ivory/80">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} dir="ltr">{store.phone}</a>
            </li>
          )}
          {store.whatsapp && (
            <li className="text-sm text-ivory/80">
              <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </li>
          )}
          {store.email && (
            <li className="flex items-center gap-2 text-sm text-ivory/80">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${store.email}`}>{store.email}</a>
            </li>
          )}
          {store.address && (
            <li className="flex items-start gap-2 text-sm text-ivory/80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{store.address}</span>
            </li>
          )}
          <FooterLink href={h("/pages/contact")}>{d.footer.contact}</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {store.legalName || store.name}. {d.footer.rights}
          </p>
          <p>{d.footer.payments}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-saffron">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-ivory/80 transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}
