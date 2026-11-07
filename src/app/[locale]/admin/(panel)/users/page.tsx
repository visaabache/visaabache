import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/localized";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createStaffAction, updateStaffAction } from "@/actions/admin/system";
import { Alert, Card, CardHeader } from "@/components/ui/misc";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Users({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tu = t.admin.users;
  await requireStaff(locale, "users.manage");
  const staff = await prisma.user.findMany({ where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } }, orderBy: { createdAt: "asc" } });
  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader title={tu.title} />
      <Alert tone="info">{tu.roleHelp}</Alert>
      <Card>
        <ul className="divide-y divide-slate-100">
          {staff.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-[220px] flex-1"><p className="font-medium">{u.firstName} {u.lastName}</p><p className="text-xs text-slate-500">{u.email} · {tu.lastLogin}: {formatDate(u.lastLoginAt, locale, true)}</p></div>
              <ActionForm action={updateStaffAction.bind(null, locale, u.id)} inline submitLabel={t.common.save} submitSize="sm">
                <Select name="role" defaultValue={u.role} className="h-9 w-40">{(["STAFF", "ADMIN", "OWNER", "CUSTOMER"] as const).map((r) => <option key={r} value={r}>{tu.roles[r]}</option>)}</Select>
                <Checkbox name="isActive" defaultChecked={u.isActive} label={tu.active} />
              </ActionForm>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title={tu.invite} />
        <div className="p-5">
          <ActionForm action={createStaffAction.bind(null, locale)} submitLabel={t.common.create} resetOnSuccess>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.auth.firstName}><Input name="firstName" required /></Field>
              <Field label={t.auth.lastName}><Input name="lastName" /></Field>
              <Field label={t.common.email}><Input name="email" type="email" required /></Field>
              <Field label={tu.role}><Select name="role" defaultValue="STAFF">{(["STAFF", "ADMIN", "OWNER"] as const).map((r) => <option key={r} value={r}>{tu.roles[r]}</option>)}</Select></Field>
              <Field label={tu.tempPassword} hint={t.apply.passwordHint}><Input name="password" type="text" required minLength={10} autoComplete="off" /></Field>
            </div>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
