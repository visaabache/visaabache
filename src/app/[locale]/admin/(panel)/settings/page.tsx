import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { cmiConfigured, getSettings } from "@/lib/settings";
import { whatsappApiConfigured } from "@/lib/notify/whatsapp";
import { saveSettingsAction } from "@/actions/admin/system";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/misc";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FormGrid, LocalizedInput } from "@/components/admin/fields";

export default async function Settings({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const ts = t.admin.settings;
  await requireStaff(locale, "settings.manage");
  const s = await getSettings();
  const save = (k: Parameters<typeof saveSettingsAction>[1]) => saveSettingsAction.bind(null, locale, k);
  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader title={ts.title} />
      <nav className="flex flex-wrap gap-2 text-sm">{(["business", "whatsapp", "payments", "notifications", "retention", "seo"] as const).map((k) => <a key={k} href={`#${k}`} className="rounded-full bg-white px-3 py-1 shadow-sm">{ts[k]}</a>)}</nav>

      <Card id="business" className="scroll-mt-20"><CardHeader title={ts.business} /><div className="p-5">
        <ActionForm action={save("business")} submitLabel={t.common.save}>
          <FormGrid>
            <Field label={t.common.name}><Input name="name" defaultValue={s.business.name} /></Field>
            <Field label={ts.legalName}><Input name="legalName" defaultValue={s.business.legalName} /></Field>
            <Field label={t.common.email}><Input name="email" type="email" defaultValue={s.business.email} /></Field>
            <Field label={t.common.phone}><Input name="phone" defaultValue={s.business.phone} dir="ltr" /></Field>
            <Field label={ts.address}><Input name="address" defaultValue={s.business.address} /></Field>
            <Field label={ts.city}><Input name="city" defaultValue={s.business.city} /></Field>
          </FormGrid>
          <FormGrid cols={4}>
            <Field label={ts.ice}><Input name="ice" defaultValue={s.business.ice} /></Field>
            <Field label={ts.rc}><Input name="rc" defaultValue={s.business.rc} /></Field>
            <Field label={ts.ifNumber}><Input name="ifNumber" defaultValue={s.business.ifNumber} /></Field>
            <Field label={ts.patente}><Input name="patente" defaultValue={s.business.patente} /></Field>
            <Field label={ts.cndp}><Input name="cndpDeclaration" defaultValue={s.business.cndpDeclaration} /></Field>
            <Field label={ts.dpoEmail}><Input name="dpoEmail" type="email" defaultValue={s.business.dpoEmail} /></Field>
          </FormGrid>
          <LocalizedInput name="hours" label={ts.hours} value={s.business.hours} />
        </ActionForm>
      </div></Card>

      <Card id="whatsapp" className="scroll-mt-20"><CardHeader title={ts.whatsapp} action={<Badge tone={whatsappApiConfigured() ? "green" : "slate"}>Cloud API: {whatsappApiConfigured() ? ts.configured : "—"}</Badge>} /><div className="p-5">
        <ActionForm action={save("whatsapp")} submitLabel={t.common.save}>
          <Field label={ts.whatsappNumber} className="max-w-sm"><Input name="number" defaultValue={s.whatsapp.number} dir="ltr" /></Field>
          <Checkbox name="enabled" defaultChecked={s.whatsapp.enabled} label={ts.whatsappEnabled} />
          <Checkbox name="notifyCustomers" defaultChecked={s.whatsapp.notifyCustomers} label={ts.whatsappNotify} />
          <LocalizedInput name="defaultMessage" label={ts.defaultMessage} value={s.whatsapp.defaultMessage} multiline rows={2} />
        </ActionForm>
      </div></Card>

      <Card id="payments" className="scroll-mt-20"><CardHeader title={ts.payments} action={<Badge tone={cmiConfigured() ? "green" : "amber"}>{ts.cmiStatus}: {cmiConfigured() ? ts.configured : ts.notConfigured}</Badge>} /><div className="p-5">
        <ActionForm action={save("payments")} submitLabel={t.common.save}>
          <div className="flex flex-wrap gap-6">
            <Checkbox name="cardEnabled" defaultChecked={s.payments.cardEnabled} label={ts.cardEnabled} />
            <Checkbox name="bankTransferEnabled" defaultChecked={s.payments.bankTransferEnabled} label={ts.transferEnabled} />
            <Checkbox name="cashEnabled" defaultChecked={s.payments.cashEnabled} label={ts.cashEnabled} />
          </div>
          {!cmiConfigured() && <Alert tone="info">{ts.notConfigured}</Alert>}
          <FormGrid cols={4}>
            <Field label={t.account.bank}><Input name="bankName" defaultValue={s.payments.bankName} /></Field>
            <Field label={t.account.beneficiary}><Input name="bankBeneficiary" defaultValue={s.payments.bankBeneficiary} /></Field>
            <Field label={t.account.rib}><Input name="bankRib" defaultValue={s.payments.bankRib} dir="ltr" /></Field>
            <Field label={t.account.swift}><Input name="bankSwift" defaultValue={s.payments.bankSwift} dir="ltr" /></Field>
          </FormGrid>
          <LocalizedInput name="bankInstructions" label={ts.bankInstructions} value={s.payments.bankInstructions} multiline rows={2} />
          <FormGrid cols={3}>
            <Field label={ts.invoicePrefix}><Input name="invoicePrefix" defaultValue={s.payments.invoicePrefix} /></Field>
            <Field label={ts.dueDays}><Input name="invoiceDueDays" type="number" defaultValue={s.payments.invoiceDueDays} /></Field>
            <Field label={ts.vatRate}><Input name="vatRate" type="number" step="0.1" defaultValue={s.payments.vatRate} /></Field>
          </FormGrid>
          <LocalizedInput name="invoiceFooter" label={ts.invoiceFooter} value={s.payments.invoiceFooter} multiline rows={2} />
        </ActionForm>
      </div></Card>

      <Card id="notifications" className="scroll-mt-20"><CardHeader title={ts.notifications} action={<Badge>{ts.emailDriver}: {process.env.EMAIL_DRIVER || "console"}</Badge>} /><div className="p-5">
        <ActionForm action={save("notifications")} submitLabel={t.common.save}>
          <Checkbox name="emailEnabled" defaultChecked={s.notifications.emailEnabled} label={ts.emailEnabled} />
          <Field label={ts.adminEmail} className="max-w-sm"><Input name="adminEmail" type="email" defaultValue={s.notifications.adminEmail} /></Field>
          <Checkbox name="notifyAdminOnNewApplication" defaultChecked={s.notifications.notifyAdminOnNewApplication} label={ts.notifyNewApp} />
          <Checkbox name="notifyAdminOnNewInquiry" defaultChecked={s.notifications.notifyAdminOnNewInquiry} label={ts.notifyNewInquiry} />
          <FormGrid cols={3}>
            <Field label={ts.payReminderDays}><Input name="paymentReminderDays" type="number" min="1" defaultValue={s.notifications.paymentReminderDays} /></Field>
            <Field label={ts.docsReminderDays}><Input name="missingDocsReminderDays" type="number" min="1" defaultValue={s.notifications.missingDocsReminderDays} /></Field>
            <Field label={ts.maxReminders}><Input name="maxReminders" type="number" min="0" defaultValue={s.notifications.maxReminders} /></Field>
          </FormGrid>
        </ActionForm>
      </div></Card>

      <Card id="retention" className="scroll-mt-20"><CardHeader title={ts.retention} description={t.admin.compliance.retentionInfo} /><div className="p-5">
        <ActionForm action={save("retention")} submitLabel={t.common.save}>
          <FormGrid>
            <Field label={ts.archiveAfter}><Input name="archiveCompletedAfterDays" type="number" min="1" defaultValue={s.retention.archiveCompletedAfterDays} /></Field>
            <Field label={ts.deleteDocsAfter}><Input name="deleteDocumentsAfterDays" type="number" min="0" defaultValue={s.retention.deleteDocumentsAfterDays} /></Field>
            <Field label={ts.deleteDraftsAfter}><Input name="deleteDraftsAfterDays" type="number" min="1" defaultValue={s.retention.deleteDraftsAfterDays} /></Field>
            <Field label={ts.anonymizeAfter}><Input name="anonymizeInactiveCustomersAfterDays" type="number" min="0" defaultValue={s.retention.anonymizeInactiveCustomersAfterDays} /></Field>
          </FormGrid>
        </ActionForm>
      </div></Card>

      <Card id="seo" className="scroll-mt-20"><CardHeader title={ts.seo} /><div className="p-5">
        <ActionForm action={save("seo")} submitLabel={t.common.save}>
          <LocalizedInput name="siteTitle" label={ts.siteTitle} value={s.seo.siteTitle} />
          <LocalizedInput name="siteDescription" label={ts.siteDescription} value={s.seo.siteDescription} multiline rows={2} />
          <LocalizedInput name="keywords" label={ts.keywords} value={s.seo.keywords} multiline rows={2} />
          <FormGrid cols={3}>
            <Field label={ts.gaId}><Input name="gaMeasurementId" defaultValue={s.seo.gaMeasurementId} dir="ltr" /></Field>
            <Field label={ts.gscVerification}><Input name="googleSiteVerification" defaultValue={s.seo.googleSiteVerification} dir="ltr" /></Field>
            <Field label={ts.ogImage}><Input name="ogImageUrl" defaultValue={s.seo.ogImageUrl} dir="ltr" /></Field>
          </FormGrid>
          <p className="text-sm font-medium">{ts.social}</p>
          <FormGrid cols={3}>{(["facebook", "instagram", "tiktok", "linkedin", "youtube"] as const).map((k) => <Field key={k} label={k}><Input name={`social.${k}`} defaultValue={s.seo.social[k]} dir="ltr" placeholder="https://" /></Field>)}</FormGrid>
        </ActionForm>
      </div></Card>
    </div>
  );
}
