import type { Language } from "@/features/translation/services/languageService";

/**
 * This site's language for one of a bureau's.
 *
 * Suliko Office names a language by a code ("ru"); this site by a number and
 * two names ("Russian Language", "რუსული ენა"). The English name is what the
 * two share, so a code is looked up by it, without regard to case and without
 * the word this site adds to most of its names. The Office API matches the
 * same way for its own use (`match_language` in order_translations.py), and the
 * list below is that one.
 */

/** What a code is called here. More than one name where this site spells it its own way. */
const CODE_NAMES: Record<string, string[]> = {
  ka: ["Georgian"],
  en: ["English"],
  ru: ["Russian"],
  de: ["German"],
  fr: ["French"],
  es: ["Spanish"],
  it: ["Italian"],
  nl: ["Dutch"],
  pl: ["Polish"],
  pt: ["Portuguese"],
  tr: ["Turkish"],
  ar: ["Arabic"],
  uk: ["Ukrainian"],
  hy: ["Armenian"],
  az: ["Azerbaijani"],
  zh: ["Chinese"],
  he: ["Hebrew"],
  fa: ["Persian"],
  el: ["Greek"],
  ja: ["Japanese"],
  lv: ["Latvian"],
  sl: ["Slovenian"],
  sk: ["Slovak"],
  sr: ["Serbian"],
  ur: ["Urdu"],
  fi: ["Finnish", "Finish"],
  la: ["Latin"],
  ro: ["Romanian"],
};

/** What this site appends to a language's name, in either script. */
const NAME_SUFFIXES = new Set(["language", "ენა"]);

function plain(name: string | null | undefined): string {
  const words = (name ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  while (words.length && NAME_SUFFIXES.has(words[words.length - 1])) words.pop();
  return words.join(" ");
}

/** The id of the language a bureau calls `code`, or null if this site has no such language. */
export function languageIdForCode(code: string, offered: Language[]): number | null {
  const wanted = new Set((CODE_NAMES[code.toLowerCase()] ?? []).map(plain));
  if (wanted.size === 0) return null;
  return offered.find((language) => wanted.has(plain(language.name)))?.id ?? null;
}
