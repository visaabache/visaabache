import { describe, expect, it } from "vitest";
import { fillTemplate, slugify, toWhatsAppNumber, whatsappLink } from "@/lib/utils";
import { fmt, tr, trList, formatMAD } from "@/lib/i18n/localized";
import en from "@/lib/i18n/dictionaries/en";
import fr from "@/lib/i18n/dictionaries/fr";
import ar from "@/lib/i18n/dictionaries/ar";

function keys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("i18n", () => {
  it("fr and ar dictionaries have exactly the same keys as en, with non-empty values", () => {
    const e = keys(en).sort();
    expect(keys(fr).sort()).toEqual(e);
    expect(keys(ar).sort()).toEqual(e);
    const empty = (d: unknown) => keys(d).filter((k) => !k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], d));
    expect(empty(fr)).toEqual([]);
    expect(empty(ar)).toEqual([]);
  });
  it("picks localized values with fallback", () => {
    expect(tr({ fr: "Bonjour", en: "Hello" }, "ar")).toBe("Bonjour");
    expect(tr({ ar: "مرحبا" }, "ar")).toBe("مرحبا");
    expect(trList({ en: ["a", "b"] }, "fr")).toEqual(["a", "b"]);
    expect(fmt("Hi {name}", { name: "Sara" })).toBe("Hi Sara");
    expect(formatMAD(1500, "en")).toBe("1,500 MAD");
  });
});

describe("utils", () => {
  it("normalises Moroccan WhatsApp numbers", () => {
    expect(toWhatsAppNumber("06 12 34 56 78")).toBe("212612345678");
    expect(toWhatsAppNumber("+212 6-12-34-56-78")).toBe("212612345678");
    expect(toWhatsAppNumber("00212612345678")).toBe("212612345678");
    expect(whatsappLink("0612345678", "Réf VA-26")).toBe("https://wa.me/212612345678?text=R%C3%A9f%20VA-26");
    expect(whatsappLink("", "x")).toBe("");
  });
  it("fills templates and slugifies", () => {
    expect(fillTemplate("Bonjour {{firstName}}, dossier {{ reference }} {{missing}}", { firstName: "Sara", reference: "VA-1" })).toBe("Bonjour Sara, dossier VA-1 ");
    expect(slugify("Visa Étudiant — Canada!")).toBe("visa-etudiant-canada");
  });
});
