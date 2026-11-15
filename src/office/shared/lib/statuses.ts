// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Canonical order-status definitions.
 *
 * Direct port of the PHP app's `includes/statuses.php`, which exists so the
 * same status renders identically on every screen. Keep that guarantee: this
 * module is the ONLY place a status label or colour is defined.
 *
 * The keys are the values as they are actually stored in
 * `translation_statuses.status` -- including the `payed` misspelling and the
 * space-separated values. These are live production data. Do not "tidy" them;
 * changing a key rewrites history.
 */

import type { Hue } from "@office/shared/lib/hues";

export type StatusTone =
  | "new"
  | "success"
  | "warning"
  | "pickup"
  | "info"
  | "danger"
  | "neutral";

export interface StatusDefinition {
  /** English label shown in the UI. */
  label: string;
  /**
   * Semantic bucket, as the API's `domain/statuses.py` has it. Nothing on
   * screen is coloured by it any more (see `hue`); it stays because the
   * backend's `tests/test_parity.py` reads it from this file and checks the
   * two registries agree.
   */
  tone: StatusTone;
  /**
   * Which hue of the palette (--hue-* in globals.css) a status takes
   * everywhere: both pills, the dashboard pipeline and the order timeline.
   * Finer than `tone`: Confirmed and Delivered are both a "success", but
   * teal and green, and Being Notarised is plum where the other work in
   * progress is amber.
   */
  hue: Hue;
}

export const STATUS_DEFINITIONS = {
  "new": { label: "New", tone: "new", hue: "blue" },
  "confirmed": { label: "Confirmed", tone: "success", hue: "teal" },
  "rejected": { label: "Rejected", tone: "danger", hue: "red" },
  "payed": { label: "Paid", tone: "success", hue: "green" }, // stored misspelling — intentional
  "being translated": { label: "Being Translated", tone: "warning", hue: "amber" },
  "being corrected": { label: "Being Corrected", tone: "warning", hue: "amber" },
  "being notarised": { label: "Being Notarised", tone: "warning", hue: "plum" },
  "in_progress": { label: "In Progress", tone: "warning", hue: "amber" },
  "translated": { label: "Translated", tone: "info", hue: "violet" },
  "translated_by_suliko": { label: "Translated by Suliko (AI)", tone: "info", hue: "violet" },
  "sent_for_review": { label: "Sent for Review", tone: "info", hue: "violet" },
  "sent to the translator": { label: "Sent to Translator", tone: "info", hue: "violet" },
  "documents_uploaded": { label: "Documents Uploaded", tone: "warning", hue: "amber" },
  "ready_for_pickup_notary": { label: "Ready for Pickup (Notary)", tone: "pickup", hue: "yellow" },
  "ready_for_pickup_translator": { label: "Ready for Pickup (Translator)", tone: "pickup", hue: "yellow" },
  "picked_up": { label: "Picked Up", tone: "success", hue: "green" },
  "sent to the client for confirmation": { label: "Sent to Client (Confirmation)", tone: "info", hue: "violet" },
  "sent to the client": { label: "Sent to Client", tone: "info", hue: "violet" },
  "sent to custom recipient": { label: "Sent to Custom Recipient", tone: "info", hue: "violet" },
  "reviewed": { label: "Reviewed", tone: "new", hue: "blue" },
  "ready_for_pickup": { label: "Ready for Pickup", tone: "pickup", hue: "yellow" },
  "completed": { label: "Delivered", tone: "success", hue: "green" },
  "cancelled": { label: "Cancelled", tone: "neutral", hue: "grey" },
} as const satisfies Record<string, StatusDefinition>;

export type OrderStatus = keyof typeof STATUS_DEFINITIONS;

/**
 * The message-catalogue key for a status (`statuses.<key>`).
 *
 * Stored values contain spaces ("being translated"), which a catalogue key
 * should not, so they are joined with underscores. The English `label` above
 * stays as the fallback — and as what the API parity test compares against.
 */
export function statusMessageKey(status: string | null | undefined): string {
  const key = (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  return key || "none";
}

/**
 * Statuses excluded from every financial aggregate. The PHP excluded only
 * `cancelled`; a rejected order is no more revenue than a cancelled one, so
 * both are out (decided 2026-09-24). Twin of `domain/statuses.py`.
 */
export const EXCLUDED_FROM_AGGREGATES: readonly string[] = ["cancelled", "rejected"];

/** Statuses that count as "closed" — an order in any other status is still open. */
export const CLOSED_STATUSES: readonly string[] = ["completed", "cancelled", "rejected"];

export function normalise(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

function lookup(status: string | null | undefined): StatusDefinition | undefined {
  return STATUS_DEFINITIONS[normalise(status) as OrderStatus];
}

/**
 * Human label for a status. Unknown values fall back to title-cased words,
 * exactly as `get_status_label()` does in the PHP.
 */
export function getStatusLabel(status: string | null | undefined): string {
  const key = normalise(status);
  const def = lookup(key);
  if (def) return def.label;
  if (key === "") return "No Status";
  // A bureau's own status is stored as they spelled it; show it that way.
  const raw = (status ?? "").trim();
  if (raw !== raw.toLowerCase()) return raw;
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Palette hue for a status. Unknown values and a bureau's own statuses are grey. */
export function getStatusHue(status: string | null | undefined): Hue {
  return lookup(status)?.hue ?? "grey";
}

export function isClosed(status: string | null | undefined): boolean {
  return CLOSED_STATUSES.includes(normalise(status));
}

export function countsTowardAggregates(status: string | null | undefined): boolean {
  return !EXCLUDED_FROM_AGGREGATES.includes(normalise(status));
}

/**
 * What an order can be moved TO, in the order the office works through them.
 * Everything else in STATUS_DEFINITIONS is history: shown on older orders as
 * it was, never offered. A bureau's own statuses (`custom_statuses` in the
 * reference data) come after these. Twin of `SELECTABLE_STATUSES` in
 * `domain/statuses.py`.
 */
export const SELECTABLE_STATUSES: readonly string[] = [
  "new",
  "confirmed",
  "sent to the translator",
  "being notarised",
  "ready_for_pickup",
  "completed",
];

/** The selectable statuses followed by the bureau's own. */
export function pickableStatuses(custom: readonly string[] = []): string[] {
  return [...SELECTABLE_STATUSES, ...custom];
}

/** The dashboard's "Orders by Status" board, in working order. */
export const DASHBOARD_STATUS_ORDER: readonly string[] = SELECTABLE_STATUSES;

export const DASHBOARD_STATUS_EXCLUDED: readonly string[] = EXCLUDED_FROM_AGGREGATES;
