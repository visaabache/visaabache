import { Download } from "lucide-react";
import { asLocale, localeNames, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/session";
import { changePasswordAction, requestDeletionAction, updateProfileAction } from "@/actions/account";
import { logoutEverywhereAction } from "@/actions/auth";
import { Card, CardHeader } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";

export default async function Profile({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const u = await requireUser(locale);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t.account.profileTitle} description={u.email} />
        <div className="p-5">
          <ActionForm action={updateProfileAction.bind(null, locale)} submitLabel={t.common.save}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.auth.firstName} required><Input name="firstName" defaultValue={u.firstName} required /></Field>
              <Field label={t.auth.lastName} required><Input name="lastName" defaultValue={u.lastName} required /></Field>
              <Field label={t.auth.phone} required><Input name="phone" defaultValue={u.phone || ""} required dir="ltr" /></Field>
              <Field label={t.account.city}><Input name="city" defaultValue={u.city || ""} /></Field>
              <Field label={t.account.address} className="sm:col-span-2"><Input name="address" defaultValue={u.address || ""} /></Field>
              <Field label={t.account.preferredLanguage}>
                <Select name="locale" defaultValue={u.locale}>{locales.map((l) => <option key={l} value={l}>{localeNames[l]}</option>)}</Select>
              </Field>
            </div>
            <Checkbox name="whatsappOptIn" defaultChecked={u.whatsappOptIn} label={t.account.whatsappOptIn} />
            <Checkbox name="marketingOptIn" defaultChecked={u.marketingOptIn} label={t.account.marketingOptIn} />
          </ActionForm>
        </div>
      </Card>
      <Card>
        <CardHeader title={t.account.changePassword} />
        <div className="p-5">
          <ActionForm action={changePasswordAction.bind(null, locale)} submitLabel={t.common.save} resetOnSuccess>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.account.currentPassword}><Input type="password" name="currentPassword" required autoComplete="current-password" /></Field>
              <Field label={t.account.newPassword} hint={t.apply.passwordHint}><Input type="password" name="newPassword" required autoComplete="new-password" minLength={10} /></Field>
            </div>
          </ActionForm>
          <form action={logoutEverywhereAction.bind(null, locale)} className="mt-4"><Button variant="ghost" size="sm">{t.account.activeSessions}</Button></form>
        </div>
      </Card>
      <Card>
        <CardHeader title={t.account.privacyTitle} description={t.account.privacyText} />
        <div className="space-y-6 p-5">
          <a href="/api/account/export" className="inline-flex h-10 items-center gap-2 rounded-lg border border-navy-200 px-4 text-sm font-semibold text-navy-800 hover:bg-navy-50"><Download className="h-4 w-4" />{t.account.exportData}</a>
          <ActionForm action={requestDeletionAction.bind(null, locale)} submitLabel={t.account.requestDeletion} submitVariant="danger">
            <Field label={t.account.deletionConfirm} className="max-w-xs"><Input name="confirm" required /></Field>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
