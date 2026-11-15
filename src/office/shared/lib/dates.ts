// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Date formatting.
 *
 * Suliko Office shows dates in three shapes only: a list date (`11.09.2026`),
 * a readable long date for notification group headers, and a relative "time
 * ago". Everything goes through here.
 *
 * The list date is day.month.year in both languages: what Georgia writes, and
 * what a date box shows on a Georgian computer. Tables used to say
 * `2026-10-07` while the date boxes beside them said `10-Oct-2026` (audit
 * F26). Values sent to the API and to date inputs stay `YYYY-MM-DD`
 * (`isoDay`, `toDateInputValue`, `todayIn`).
 *
 * ## Two kinds of value, treated differently
 *
 * - **Calendar dates** (`2026-09-11`): an order date, a due date. They are a
 *   day, not a moment, and are shown exactly as stored — converting them
 *   through any timezone is how a due date ends up a day early.
 * - **Timestamps** (`2026-09-11T12:57:00+00:00`): when a status changed, when
 *   a note was written. The API stores and sends these in UTC. They are shown
 *   in the BUREAU's timezone, passed in from the session.
 *
 * The timezone is explicit on purpose. `date-fns/format` uses the runtime's
 * zone, and a Server Component on Vercel runs in UTC: every time on screen was
 * four hours behind Tbilisi, and "Today" flipped at 04:00. When no zone is
 * passed, the default is the one the product is sold in.
 */

import { parseISO } from "date-fns";

/** Where a bureau is unless its settings say otherwise. Twin of the API's. */
export const DEFAULT_TIMEZONE = "Asia/Tbilisi";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a value that may be a `Date`, an ISO string, or a legacy
 * `YYYY-MM-DD HH:mm:ss`. Returns null rather than an Invalid Date so callers
 * render an em dash instead of "Invalid Date".
 */
export function parseServerDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  // Legacy "YYYY-MM-DD HH:mm:ss" -> ISO. Without the `T`, Safari refuses it.
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = parseISO(normalised);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** The parts of an instant as a wall clock in `timeZone` shows them. */
function partsIn(date: Date, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function safeZone(timeZone: string | undefined): string {
  const zone = timeZone || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return zone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * The calendar day as `YYYY-MM-DD`, for values rather than display. A
 * calendar date is taken as stored; a timestamp by the bureau's clock.
 */
export function isoDay(value: string | Date | null | undefined, timeZone?: string): string | null {
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;
  const date = parseServerDate(value);
  if (!date) return null;
  const p = partsIn(date, safeZone(timeZone));
  return `${p.year}-${p.month}-${p.day}`;
}

/** `2026-09-11` → `11.09.2026`. */
function displayDay(day: string): string {
  return `${day.slice(8, 10)}.${day.slice(5, 7)}.${day.slice(0, 4)}`;
}

/** Table/list date: `11.09.2026`. A calendar date is shown as stored. */
export function formatDate(
  value: string | Date | null | undefined,
  timeZone?: string,
): string {
  const day = isoDay(value, timeZone);
  return day ? displayDay(day) : "–";
}

/** Date with time: `11.09.2026 16:57`, in the bureau's timezone. */
export function formatDateTime(
  value: string | Date | null | undefined,
  timeZone?: string,
): string {
  const date = parseServerDate(value);
  if (!date) return "–";
  const p = partsIn(date, safeZone(timeZone));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

/** Time only: `16:57`. Used in the notification feed. */
export function formatTime(value: string | Date | null | undefined, timeZone?: string): string {
  const date = parseServerDate(value);
  if (!date) return "–";
  const p = partsIn(date, safeZone(timeZone));
  return `${p.hour}:${p.minute}`;
}

/** `YYYY-MM-DD` of the calendar day it is right now in `timeZone`. */
export function todayIn(timeZone?: string, now: Date = new Date()): string {
  const p = partsIn(now, safeZone(timeZone));
  return `${p.year}-${p.month}-${p.day}`;
}

/** The calendar day (`YYYY-MM-DD`) an instant or date falls on in `timeZone`. */
function dayOf(value: string | Date, timeZone?: string): string | null {
  return isoDay(value, timeZone);
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`. */
function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Group header for the notification feed: `Today`, `Yesterday`, or a long
 * date in the given locale. The two words come from the caller so they can be
 * translated.
 */
export function formatDayHeading(
  value: string | Date | null | undefined,
  options: { timeZone?: string; locale?: string; today?: string; yesterday?: string } = {},
): string {
  if (!value) return "–";
  const day = dayOf(value, options.timeZone);
  if (!day) return "–";
  const diff = daysBetween(day, todayIn(options.timeZone));
  if (diff === 0) return options.today ?? "Today";
  if (diff === 1) return options.yesterday ?? "Yesterday";
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(options.locale ?? "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * Whether an order's due date has passed. Compared by calendar day in the
 * bureau's timezone — an order due today is not overdue at 09:00 and overdue
 * at 17:00, and it is not overdue at 01:00 just because UTC is still on
 * yesterday.
 */
export function isOverdue(
  dueDate: string | Date | null | undefined,
  timeZone?: string,
): boolean {
  if (!dueDate) return false;
  const day = dayOf(dueDate, timeZone);
  return day !== null && daysBetween(day, todayIn(timeZone)) > 0;
}

/** `YYYY-MM-DD` for a date input value. */
export function toDateInputValue(
  value: string | Date | null | undefined,
  timeZone?: string,
): string {
  return isoDay(value, timeZone) ?? "";
}

/** `YYYY-MM-DD` plus `days`, for date defaults ("due in 5 days"). */
export function addDays(day: string, days: number): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
