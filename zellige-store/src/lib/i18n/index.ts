import type { Locale } from "./config";
import en, { type Dict } from "./dictionaries/en";
import fr from "./dictionaries/fr";
import ar from "./dictionaries/ar";

const dictionaries: Record<Locale, Dict> = { en, fr, ar };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? fr;
}

export type { Dict };
export * from "./config";
