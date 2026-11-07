export type ChecklistCondition = { question: string; op: "eq" | "neq" | "in" | "truthy"; value?: string | string[] };

export type ChecklistSource = {
  id: string;
  title: unknown;
  description: unknown;
  required: boolean;
  visaTypeCodes: string[];
  condition: unknown;
  isActive: boolean;
  sortOrder: number;
};

export type ChecklistEntry = { id: string; title: unknown; description: unknown; required: boolean };

export function matchesCondition(condition: unknown, answers: Record<string, unknown>): boolean {
  if (!condition || typeof condition !== "object") return true;
  const c = condition as ChecklistCondition;
  if (!c.question) return true;
  const answer = answers[c.question];
  const a = answer == null ? "" : String(answer);
  switch (c.op) {
    case "eq":
      return a === String(c.value ?? "");
    case "neq":
      return a !== String(c.value ?? "");
    case "in":
      return Array.isArray(c.value) ? c.value.map(String).includes(a) : a === String(c.value ?? "");
    case "truthy":
      return a !== "" && a !== "no" && a !== "false" && a !== "0";
    default:
      return true;
  }
}

/** Builds the personalised document checklist for a destination, visa type and wizard answers. */
export function buildChecklist(items: ChecklistSource[], visaTypeCode: string | null, answers: Record<string, unknown>): ChecklistEntry[] {
  return items
    .filter((i) => i.isActive)
    .filter((i) => !i.visaTypeCodes.length || (visaTypeCode != null && i.visaTypeCodes.includes(visaTypeCode)))
    .filter((i) => matchesCondition(i.condition, answers))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({ id: i.id, title: i.title, description: i.description, required: i.required }));
}
