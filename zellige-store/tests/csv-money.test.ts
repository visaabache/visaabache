import { describe, expect, it } from "vitest";
import { csvCell, parseCsv, rowsToObjects, toCsv } from "@/lib/csv";
import { centsToInput, convert, formatMoney, parseMoney } from "@/lib/money";

describe("csv", () => {
  it("parses quotes, newlines, BOM and French semicolons", () => {
    expect(parseCsv('﻿sku;name_fr\nA1;"Mug ""zellige""; bleu"\n')).toEqual([["sku", "name_fr"], ["A1", 'Mug "zellige"; bleu']]);
    expect(parseCsv('a,b\n1,"line1\nline2"')).toEqual([["a", "b"], ["1", "line1\nline2"]]);
  });
  it("normalises headers", () => expect(rowsToObjects([["Name FR", "Price (MAD)"], ["x", "9"]])).toEqual([{ name_fr: "x", price_mad: "9" }]));
  it("neutralises spreadsheet formulas on export", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(toCsv(["a"], [["x,y"]])).toBe('﻿a\r\n"x,y"\r\n');
  });
});

describe("money", () => {
  it("parses dirham inputs", () => {
    expect(parseMoney("149")).toBe(14900);
    expect(parseMoney("149,90")).toBe(14990);
    expect(parseMoney("149.9 DH")).toBe(14990);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
    expect(centsToInput(14900)).toBe("149");
  });
  it("formats MAD per locale and converts currencies", () => {
    expect(formatMoney(28420, "fr")).toBe("284,20 DH");
    expect(formatMoney(9900, "ar")).toBe("99 د.م.");
    expect(convert(10000, { code: "EUR", symbol: "€", rate: 0.092, decimals: 2 })).toBe(9.2);
  });
});
