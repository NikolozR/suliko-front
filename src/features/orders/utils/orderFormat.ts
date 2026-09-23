import type { LanguagePair } from "../types/types.Orders";

/**
 * Languages offered when a translator creates an order. The CRM stores these
 * ISO codes; names come from the browser (Intl.DisplayNames), so they appear
 * in whichever interface language the user has chosen.
 */
export const ORDER_LANGUAGE_CODES = [
  "ka", "en", "ru", "de", "fr", "it", "es", "pt", "tr", "az", "hy", "uk", "pl",
  "ar", "he", "zh", "ja", "ko", "el", "nl", "sv", "da", "no", "fi", "cs", "sk",
  "sl", "sr", "hr", "bg", "ro", "hu", "lv", "lt", "et", "fa", "ur", "hi", "kk",
  "uz", "be", "la",
] as const;

const displayNames = new Map<string, Intl.DisplayNames | null>();

export function languageName(code: string, locale: string): string {
  if (!displayNames.has(locale)) {
    try {
      displayNames.set(locale, new Intl.DisplayNames([locale], { type: "language" }));
    } catch {
      displayNames.set(locale, null);
    }
  }
  try {
    const name = displayNames.get(locale)?.of(code);
    if (name && name !== code) return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch {
    // An unknown code falls through to the code itself.
  }
  return code.toUpperCase();
}

export function pairLabel(pair: LanguagePair, locale: string): string {
  return `${languageName(pair.source_language, locale)} → ${languageName(pair.target_language, locale)}`;
}

/** A `YYYY-MM-DD` date as a local calendar date, so it never shifts a day in UTC-negative zones. */
export function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isPastDue(value: string | null): boolean {
  if (!value) return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return value.slice(0, 10) < todayIso;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
