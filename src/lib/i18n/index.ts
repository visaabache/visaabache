import "server-only";
import en from "./dictionaries/en";
import fr from "./dictionaries/fr";
import ar from "./dictionaries/ar";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, fr, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? fr;
}

export type { Dictionary };
