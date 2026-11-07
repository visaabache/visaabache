import Link from "next/link";
import { asLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { saveTemplateAction } from "@/actions/admin/system";
import { Alert, Badge, Card } from "@/components/ui/misc";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/forms/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export default async function Templates({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ key?: string }> }) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const tt = t.admin.templates;
  await requireStaff(locale, "settings.manage");
  const keys = (await prisma.notificationTemplate.findMany({ distinct: ["key"], select: { key: true }, orderBy: { key: "asc" } })).map((k) => k.key);
  const { key: requested } = await searchParams;
  const key = requested && keys.includes(requested) ? requested : keys[0];
  const items = key ? await prisma.notificationTemplate.findMany({ where: { key }, orderBy: [{ channel: "asc" }, { locale: "asc" }] }) : [];
  return (
    <div className="max-w-6xl">
      <AdminPageHeader title={tt.title} />
      <Alert tone="info" className="mb-6"><code className="text-xs">{tt.help}</code></Alert>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={tt.key}>
          {keys.map((k) => (
            <Link key={k} href={`?key=${k}`} className={cn("shrink-0 rounded-lg px-3 py-2 font-mono text-xs", k === key ? "bg-navy-800 text-white" : "bg-white hover:bg-slate-100")}>{k}</Link>
          ))}
        </nav>
        <div className="space-y-4">
          {items.map((i) => (
            <Card key={i.id} className="p-5">
              <div className="mb-3 flex gap-2"><Badge tone={i.channel === "WHATSAPP" ? "green" : "navy"}>{i.channel}</Badge><Badge>{i.locale.toUpperCase()}</Badge></div>
              <ActionForm action={saveTemplateAction.bind(null, locale, i.id)} submitLabel={t.common.save} submitSize="sm">
                {i.channel === "EMAIL" && <Field label={tt.subject}><Input name="subject" defaultValue={i.subject || ""} dir={i.locale === "ar" ? "rtl" : "ltr"} /></Field>}
                <Field label={tt.body}><Textarea name="body" defaultValue={i.body} rows={7} dir={i.locale === "ar" ? "rtl" : "ltr"} /></Field>
                <Checkbox name="isActive" defaultChecked={i.isActive} label={t.admin.content.active} />
              </ActionForm>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
