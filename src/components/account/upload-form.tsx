"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { uploadDocumentAction } from "@/actions/apply";
import { Alert } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

type Opt = { value: string; label: string; kind: "request" | "checklist" | "other" };

export function DocumentUploadForm({ locale, applicationId, options, labels }: {
  locale: string; applicationId: string; options: Opt[];
  labels: { label: string; file: string; upload: string; other: string; hint: string };
}) {
  const [target, setTarget] = useState(options[0] ? `${options[0].kind}:${options[0].value}` : "other:");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOk] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const [kind, value] = target.split(/:(.*)/s);
    const opt = options.find((o) => o.kind === kind && o.value === value);
    const fd = new FormData();
    fd.set("applicationId", applicationId);
    fd.set("file", file);
    fd.set("label", kind === "other" ? custom || file.name : opt?.label || file.name);
    if (kind === "request") fd.set("requestId", value);
    if (kind === "checklist") fd.set("checklistItemId", value);
    setError(null);
    setOk(false);
    start(async () => {
      const r = await uploadDocumentAction(locale, fd);
      if (!r.ok) setError(r.error || "Error");
      else {
        setOk(true);
        if (fileRef.current) fileRef.current.value = "";
        setCustom("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      {okMsg && <Alert tone="success">✓</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={labels.label}>
          {options.map((o) => <option key={`${o.kind}:${o.value}`} value={`${o.kind}:${o.value}`}>{o.label}</option>)}
          <option value="other:">{labels.other}</option>
        </Select>
        {target.startsWith("other:") && <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={labels.label} maxLength={160} />}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label={labels.file} className="block max-w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-800" />
        <Button type="button" variant="navy" onClick={submit} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} {labels.upload}
        </Button>
      </div>
      <p className="text-xs text-slate-500">{labels.hint}</p>
    </div>
  );
}
