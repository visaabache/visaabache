import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { saveTemplateAction } from "@/actions/admin/system";
import { Alert, Badge } from "@/components/ui/misc";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function Templates({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tt = t.admin.templates;
  await requireStaff(locale, "settings.manage");
  const items = await prisma.notificationTemplate.findMany({ orderBy: [{ key: "asc" }, { channel: "asc" }, { locale: "asc" }] });
  const keys = [...new Set(items.map((i) => i.key))];
  return (
    <div className="max-w-5xl space-y-4">
      <AdminPageHeader title={tt.title} />
      <Alert tone="info"><code className="text-xs">{tt.help}</code></Alert>
      {keys.map((k) => (
        <details key={k} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-3 font-mono text-sm font-semibold">{k}</summary>
          <div className="space-y-4 border-t border-slate-100 p-5">
            {items.filter((i) => i.key === k).map((i) => (
              <div key={i.id} className="rounded-xl border border-slate-100 p-4">
                <div className="mb-2 flex gap-2"><Badge tone={i.channel === "WHATSAPP" ? "green" : "navy"}>{i.channel}</Badge><Badge>{i.locale.toUpperCase()}</Badge></div>
                <ActionForm action={saveTemplateAction.bind(null, locale, i.id)} submitLabel={t.common.save} submitSize="sm">
                  {i.channel === "EMAIL" && <Field label={tt.subject}><Input name="subject" defaultValue={i.subject || ""} dir={i.locale === "ar" ? "rtl" : "ltr"} /></Field>}
                  <Field label={tt.body}><Textarea name="body" defaultValue={i.body} rows={6} dir={i.locale === "ar" ? "rtl" : "ltr"} /></Field>
                  <Checkbox name="isActive" defaultChecked={i.isActive} label={t.admin.content.active} />
                </ActionForm>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
