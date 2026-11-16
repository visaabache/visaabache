import { prisma } from "@/lib/db";
import { getSettings, providerReady } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth/session";
import { deleteCurrency, revokeStaff, saveCurrency, saveSettings, saveStaff } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Badge, Card, Field, SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const owner = me.role === "ADMIN";
  const [s, currencies, staff] = await Promise.all([getSettings(), prisma.currency.findMany({ orderBy: { sortOrder: "asc" } }), prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, orderBy: { createdAt: "asc" } })]);
  const env = (k: string) => !!process.env[k];
  const storage = env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY") ? "Supabase Storage" : "Local disk (./storage/uploads)";

  return (
    <>
      <PageHeader title="Settings" description={owner ? undefined : "Only the owner can change settings."} />
      <fieldset disabled={!owner} className="space-y-6">
        <Card title="Shop">
          <AdminForm action={saveSettings} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="section" value="store" />
            <Field label="Shop name"><input name="name" required defaultValue={s.store.name} className="field" /></Field>
            <Field label="Tagline"><input name="tagline" defaultValue={s.store.tagline} className="field" /></Field>
            <Field label="Contact email"><input name="email" type="email" defaultValue={s.store.email} className="field" /></Field>
            <Field label="Phone"><input name="phone" defaultValue={s.store.phone} className="field" /></Field>
            <Field label="WhatsApp number" hint="International format, e.g. 212612345678"><input name="whatsapp" defaultValue={s.store.whatsapp} className="field" /></Field>
            <Field label="Address"><input name="address" defaultValue={s.store.address} className="field" /></Field>
            <Field label="Legal name (company)"><input name="legalName" defaultValue={s.store.legalName} className="field" /></Field>
            <Field label="ICE"><input name="ice" defaultValue={s.store.ice} className="field" /></Field>
            <div />
            <Field label="Instagram URL"><input name="instagram" defaultValue={s.store.instagram} placeholder="https://instagram.com/…" className="field" /></Field>
            <Field label="Facebook URL"><input name="facebook" defaultValue={s.store.facebook} className="field" /></Field>
            <Field label="TikTok URL"><input name="tiktok" defaultValue={s.store.tiktok} className="field" /></Field>
            <Field label="Pinterest URL"><input name="pinterest" defaultValue={s.store.pinterest} className="field" /></Field>
            <div className="md:col-span-2 lg:col-span-3"><SubmitButton>Save</SubmitButton></div>
          </AdminForm>
        </Card>

        <Card title="Payments">
          <AdminForm action={saveSettings} className="space-y-5">
            <input type="hidden" name="section" value="payments" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["codEnabled", "Cash on delivery", "Morocco only; can be disabled per city", true],
                ["bankTransferEnabled", "Bank transfer", s.payments.rib || s.payments.iban ? "Shown with your RIB" : "Add a RIB or IBAN below to offer it", !!(s.payments.rib || s.payments.iban)],
                ["cmiEnabled", "Card via CMI", providerReady("CMI", { ...s.payments, cmiEnabled: true }) ? "Credentials configured" : "Set CMI_CLIENT_ID and CMI_STORE_KEY", providerReady("CMI", { ...s.payments, cmiEnabled: true })],
                ["stripeEnabled", "International card (Stripe)", providerReady("STRIPE", { ...s.payments, stripeEnabled: true }) ? "Credentials configured" : "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET", providerReady("STRIPE", { ...s.payments, stripeEnabled: true })],
              ] as const).map(([k, label, hint, ready]) => (
                <label key={k} className="flex items-start gap-3 rounded-xl border border-charcoal/10 p-4 text-sm">
                  <input type="checkbox" name={k} defaultChecked={s.payments[k]} className="mt-0.5 h-4 w-4 accent-majorelle" />
                  <span><span className="font-semibold">{label}</span> {!ready && <Badge tone="yellow">not ready</Badge>}<span className="block text-xs text-charcoal-500">{hint}</span></span>
                </label>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Account holder"><input name="bankHolder" defaultValue={s.payments.bankHolder} className="field" /></Field>
              <Field label="Bank"><input name="bankName" defaultValue={s.payments.bankName} className="field" /></Field>
              <Field label="RIB (24 digits)"><input name="rib" defaultValue={s.payments.rib} className="field font-mono" /></Field>
              <Field label="IBAN"><input name="iban" defaultValue={s.payments.iban} className="field font-mono" /></Field>
              <Field label="SWIFT / BIC"><input name="swift" defaultValue={s.payments.swift} className="field font-mono" /></Field>
            </div>
            <SubmitButton>Save</SubmitButton>
          </AdminForm>
        </Card>

        <Card title="Inventory alerts">
          <AdminForm action={saveSettings} className="grid gap-4 md:grid-cols-3">
            <input type="hidden" name="section" value="inventory" />
            <Field label="Default low-stock threshold"><input name="lowStockThreshold" type="number" min={0} defaultValue={s.inventory.lowStockThreshold} className="field" /></Field>
            <Field label="Alert and new-order email" hint="Defaults to the contact email"><input name="alertEmail" type="email" defaultValue={s.inventory.alertEmail} className="field" /></Field>
            <div className="flex items-end"><SubmitButton>Save</SubmitButton></div>
          </AdminForm>
        </Card>

        <Card title="Currencies">
          <p className="mb-4 text-sm text-charcoal-600">Prices are stored in MAD. Other currencies are for display (and charged directly through Stripe for EUR, USD, GBP, CAD, CHF). Update the rates regularly.</p>
          <div className="space-y-2">
            {currencies.map((c) => (
              <AdminForm key={c.code} action={saveCurrency} className="flex flex-wrap items-end gap-3 rounded-xl border border-charcoal/10 p-3">
                <input type="hidden" name="code" value={c.code} />
                <span className="w-14 font-mono font-semibold">{c.code}</span>
                <Field label="Symbol" className="w-20"><input name="symbol" defaultValue={c.symbol} className="field py-2" /></Field>
                <Field label="1 MAD =" className="w-32"><input name="rateFromMad" defaultValue={c.rateFromMad} disabled={c.code === "MAD"} className="field py-2" /></Field>
                <Field label="Decimals" className="w-20"><input name="decimals" type="number" min={0} max={3} defaultValue={c.decimals} className="field py-2" /></Field>
                <Field label="Sort" className="w-20"><input name="sortOrder" type="number" defaultValue={c.sortOrder} className="field py-2" /></Field>
                <label className="flex items-center gap-2 pb-2.5 text-sm"><input type="checkbox" name="isActive" defaultChecked={c.isActive} disabled={c.code === "MAD"} className="h-4 w-4 accent-majorelle" />Active</label>
                <SubmitButton variant="outline">Save</SubmitButton>
                {c.code !== "MAD" && <ActionButton action={deleteCurrency} fields={{ code: c.code }} variant="danger" confirm={`Remove ${c.code}?`}>Remove</ActionButton>}
              </AdminForm>
            ))}
            <AdminForm action={saveCurrency} resetOnSuccess className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-charcoal/20 p-3">
              <Field label="Code" className="w-20"><input name="code" required maxLength={3} className="field py-2 uppercase" /></Field>
              <Field label="Symbol" className="w-20"><input name="symbol" className="field py-2" /></Field>
              <Field label="1 MAD =" className="w-32"><input name="rateFromMad" required className="field py-2" /></Field>
              <input type="hidden" name="isActive" value="on" />
              <SubmitButton variant="outline">Add currency</SubmitButton>
            </AdminForm>
          </div>
        </Card>

        <Card title="Team">
          <ul className="mb-4 divide-y divide-charcoal/5 text-sm">
            {staff.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="flex-1"><span className="font-semibold">{u.name}</span> <span className="text-charcoal-500">{u.email}</span></span>
                <Badge tone={u.role === "ADMIN" ? "blue" : "neutral"}>{u.role === "ADMIN" ? "owner" : "staff"}</Badge>
                {u.id !== me.id && <ActionButton action={revokeStaff} fields={{ id: u.id }} variant="danger" confirm="Remove admin access?">Revoke</ActionButton>}
              </li>
            ))}
          </ul>
          <AdminForm action={saveStaff} resetOnSuccess className="grid gap-3 md:grid-cols-5">
            <Field label="Name"><input name="name" required className="field" /></Field>
            <Field label="Email"><input name="email" type="email" required className="field" /></Field>
            <Field label="Password" hint="10+ characters; empty keeps an existing one"><input name="password" type="password" autoComplete="new-password" className="field" /></Field>
            <Field label="Role"><select name="role" className="field"><option value="STAFF">Staff: catalog and orders</option><option value="ADMIN">Owner: everything</option></select></Field>
            <div className="flex items-end"><SubmitButton>Add or update</SubmitButton></div>
          </AdminForm>
        </Card>
      </fieldset>

      <Card title="System" className="mt-6">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <dt className="text-charcoal-500">Image storage</dt><dd>{storage}</dd>
          <dt className="text-charcoal-500">Transactional email</dt><dd>{env("RESEND_API_KEY") ? "Resend" : "Not configured: emails are only logged"}</dd>
          <dt className="text-charcoal-500">Site URL</dt><dd>{process.env.NEXT_PUBLIC_SITE_URL || "not set"}</dd>
          <dt className="text-charcoal-500">CMI gateway</dt><dd>{process.env.CMI_GATEWAY_URL || "test platform (default)"}</dd>
        </dl>
      </Card>
    </>
  );
}
