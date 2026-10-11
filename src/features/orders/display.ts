/** How an order's bare facts (a language code, a due date) are put in front of a person. */

/**
 * Chrome has no Georgian in its `Intl` data: asked for a date or a language
 * name in "ka", it answers in English, without complaint. Georgian is the
 * language most people read this site in, so its months and its names for the
 * languages bureaus work in are written out here.
 */
const KA_MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

const KA_LANGUAGES: Record<string, string> = {
  ka: "ქართული",
  en: "ინგლისური",
  ru: "რუსული",
  de: "გერმანული",
  fr: "ფრანგული",
  es: "ესპანური",
  it: "იტალიური",
  nl: "ნიდერლანდური",
  pl: "პოლონური",
  pt: "პორტუგალიური",
  tr: "თურქული",
  ar: "არაბული",
  uk: "უკრაინული",
  hy: "სომხური",
  az: "აზერბაიჯანული",
  zh: "ჩინური",
  he: "ებრაული",
  fa: "სპარსული",
  el: "ბერძნული",
  ja: "იაპონური",
  lv: "ლატვიური",
  sl: "სლოვენური",
  sk: "სლოვაკური",
  sr: "სერბული",
  ur: "ურდუ",
  fi: "ფინური",
  la: "ლათინური",
  ro: "რუმინული",
};

const isGeorgian = (locale: string) => locale.toLowerCase().startsWith("ka");

/**
 * The language a bureau calls `code` ("ru"), named in the reader's own
 * language ("Russian", "რუსული"). A code nobody here has a name for is shown
 * as it is.
 */
export function languageName(code: string, locale: string): string {
  const plain = code.toLowerCase();
  if (isGeorgian(locale)) return KA_LANGUAGES[plain] ?? KA_LANGUAGES[plain.split("-")[0]] ?? code.toUpperCase();
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(code);
    if (name && name.toLowerCase() !== plain) return name;
  } catch {
    // Not a code the browser can read at all.
  }
  return code.toUpperCase();
}

/** A date as people write it here: "15 Oct 2026", "15 ოქტ 2026". */
export function formatDate(date: Date, locale: string): string {
  if (isGeorgian(locale)) {
    return `${date.getDate()} ${KA_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** A day the Office API sends ("2026-10-15") as that day here, not as midnight in Greenwich. */
export function parseDay(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type Due =
  | { when: "none" }
  /**
   * `days`: whole days from today to the due date, negative once it has passed.
   * `urgency`: how loudly to say it.
   */
  | { when: "set"; date: Date; days: number; urgency: "overdue" | "soon" | "calm" };

/** The most days ahead that still count as "soon". */
const SOON_DAYS = 3;

export function dueOf(dueDate: string | null, now: Date = new Date()): Due {
  const date = dueDate ? parseDay(dueDate) : null;
  if (!date) return { when: "none" };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  return {
    when: "set",
    date,
    days,
    urgency: days < 0 ? "overdue" : days <= SOON_DAYS ? "soon" : "calm",
  };
}

export type DocumentStatus = "notStarted" | "inProgress" | "sent";
