import type { ShippingCity, ShippingZone } from "@prisma/client";
import { prisma } from "@/lib/db";
import { tr } from "@/lib/i18n/config";
import { centsToInput, formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { deleteCity, deleteZone, saveCity, saveSettings, saveZone } from "@/actions/admin/store";
import { PageHeader } from "@/components/admin/AdminNav";
import { ActionButton, AdminForm, Badge, Card, Field, I18nField, SubmitButton } from "@/components/admin/ui";
import { COURIERS } from "@/lib/couriers";

export const metadata = { title: "Delivery" };
type I18n = Partial<Record<"fr" | "ar" | "en", string>> | null;

function CityFields({ c }: { c?: ShippingCity }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="sm:col-span-2"><I18nField name="name" label="City" value={(c?.name as I18n) ?? null} required /></div>
      <Field label="Region"><input name="region" defaultValue={c?.region ?? ""} className="field" /></Field>
      <Field label="Fee (MAD)"><input name="fee" required defaultValue={c ? centsToInput(c.fee) : ""} className="field" /></Field>
      <Field label="Min days"><input name="minDays" type="number" min={0} defaultValue={c?.minDays ?? 1} className="field" /></Field>
      <Field label="Max days"><input name="maxDays" type="number" min={0} defaultValue={c?.maxDays ?? 3} className="field" /></Field>
      <Field label="Sort"><input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="field" /></Field>
      <div className="flex items-end gap-4 pb-3 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="codAvailable" defaultChecked={c?.codAvailable ?? true} className="h-4 w-4 accent-majorelle" />COD</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} className="h-4 w-4 accent-majorelle" />Active</label>
      </div>
    </div>
  );
}

function ZoneFields({ z }: { z?: ShippingZone }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {z && <input type="hidden" name="id" value={z.id} />}
      <div className="sm:col-span-2"><I18nField name="name" label="Zone name" value={(z?.name as I18n) ?? null} required /></div>
      <div className="sm:col-span-2"><Field label="Countries (ISO codes)" hint="e.g. FR, BE, ES, DE, NL"><input name="countries" required defaultValue={z?.countries.join(", ")} className="field font-mono uppercase" /></Field></div>
      <Field label="Base fee (MAD)" hint="First kilogram"><input name="fee" required defaultValue={z ? centsToInput(z.fee) : ""} className="field" /></Field>
      <Field label="Per extra kg (MAD)"><input name="perKgFee" defaultValue={z ? centsToInput(z.perKgFee) : ""} className="field" /></Field>
      <Field label="Free over (MAD)" hint="Empty = never"><input name="freeOver" defaultValue={z?.freeOver ? centsToInput(z.freeOver) : ""} className="field" /></Field>
      <Field label="Sort"><input name="sortOrder" type="number" defaultValue={z?.sortOrder ?? 0} className="field" /></Field>
      <Field label="Min days"><input name="minDays" type="number" min={0} defaultValue={z?.minDays ?? 5} className="field" /></Field>
      <Field label="Max days"><input name="maxDays" type="number" min={0} defaultValue={z?.maxDays ?? 12} className="field" /></Field>
      <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="isActive" defaultChecked={z?.isActive ?? true} className="h-4 w-4 accent-majorelle" />Active</label>
    </div>
  );
}

export default async function ShippingPage() {
  const [cities, zones, s] = await Promise.all([prisma.shippingCity.findMany({ orderBy: [{ sortOrder: "asc" }] }), prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } }), getSettings()]);
  return (
    <>
      <PageHeader title="Delivery" description="Morocco is priced by city; other countries by zone." />
      <Card title="Morocco: general rules" className="mb-6">
        <AdminForm action={saveSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input type="hidden" name="section" value="shipping" />
          <Field label="Free delivery from (MAD)" hint="0 = never free"><input name="freeThresholdMa" defaultValue={centsToInput(s.shipping.freeThresholdMa)} className="field" /></Field>
          <Field label="Fee for unlisted cities (MAD)"><input name="otherCityFee" defaultValue={centsToInput(s.shipping.otherCityFee)} className="field" /></Field>
          <Field label="Unlisted: min days"><input name="otherCityMinDays" type="number" defaultValue={s.shipping.otherCityMinDays} className="field" /></Field>
          <Field label="Unlisted: max days"><input name="otherCityMaxDays" type="number" defaultValue={s.shipping.otherCityMaxDays} className="field" /></Field>
          <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="internationalEnabled" defaultChecked={s.shipping.internationalEnabled} className="h-4 w-4 accent-majorelle" />International</label>
          <div className="sm:col-span-2 lg:col-span-5"><SubmitButton>Save rules</SubmitButton></div>
        </AdminForm>
      </Card>

      <Card title={`Moroccan cities (${cities.length})`} className="mb-6">
        <details className="mb-4 rounded-xl border border-dashed border-charcoal/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-majorelle">+ Add a city</summary>
          <AdminForm action={saveCity} resetOnSuccess className="mt-4 space-y-3"><CityFields /><SubmitButton>Add city</SubmitButton></AdminForm>
        </details>
        <div className="divide-y divide-charcoal/5">
          {cities.map((c) => (
            <details key={c.id}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="w-40 font-semibold">{tr(c.name, "fr")}</span>
                <span className="w-24">{formatMoney(c.fee, "fr")}</span>
                <span className="text-charcoal-500">{c.minDays}–{c.maxDays} days</span>
                {!c.codAvailable && <Badge tone="yellow">no COD</Badge>}
                {!c.isActive && <Badge>inactive</Badge>}
                <span className="ms-auto text-majorelle">Edit</span>
              </summary>
              <div className="pb-4">
                <AdminForm action={saveCity} className="space-y-3"><CityFields c={c} /><SubmitButton>Save</SubmitButton></AdminForm>
                <div className="mt-2"><ActionButton action={deleteCity} fields={{ id: c.id }} variant="danger" confirm="Remove this city?">Remove</ActionButton></div>
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card title="International zones" className="mb-6">
        <details className="mb-4 rounded-xl border border-dashed border-charcoal/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-majorelle">+ Add a zone</summary>
          <AdminForm action={saveZone} resetOnSuccess className="mt-4 space-y-3"><ZoneFields /><SubmitButton>Add zone</SubmitButton></AdminForm>
        </details>
        <div className="divide-y divide-charcoal/5">
          {zones.map((z) => (
            <details key={z.id}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="w-48 font-semibold">{tr(z.name, "fr")}</span>
                <span className="font-mono text-xs text-charcoal-500">{z.countries.join(" ")}</span>
                <span>{formatMoney(z.fee, "fr")}{z.perKgFee ? ` + ${formatMoney(z.perKgFee, "fr")}/kg` : ""}</span>
                <span className="text-charcoal-500">{z.minDays}–{z.maxDays} days</span>
                {!z.isActive && <Badge>inactive</Badge>}
                <span className="ms-auto text-majorelle">Edit</span>
              </summary>
              <div className="pb-4">
                <AdminForm action={saveZone} className="space-y-3"><ZoneFields z={z} /><SubmitButton>Save</SubmitButton></AdminForm>
                <div className="mt-2"><ActionButton action={deleteZone} fields={{ id: z.id }} variant="danger" confirm="Remove this zone?">Remove</ActionButton></div>
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card title="Carriers">
        <p className="text-sm text-charcoal-600">Choose the carrier and enter the tracking number on each order: the tracking link is built automatically for {COURIERS.filter((c) => c.trackingUrl).map((c) => c.name).join(", ")}. API integrations (automatic shipment creation and status updates) plug into <code className="text-xs">src/lib/couriers.ts</code>.</p>
      </Card>
    </>
  );
}
