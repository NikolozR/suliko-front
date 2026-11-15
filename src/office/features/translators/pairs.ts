// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { TranslatorLanguagePair } from "@office/features/directory/types";

/**
 * A translator's language pairs, as people think of them: KA <-> EN.
 *
 * The API stores one row per direction and, when a pair is saved, saves its
 * reverse with it unless the pair is sent `one_way`. So a profile that works
 * both ways has two rows (KA to EN, EN to KA) and one that goes one way has
 * one. The screens show one line per pair (`groupPairs`); the form sends it
 * back as directions (`pairsFromRows`). `bothWays` is the API's rule, here so
 * the form can tell whether a save changes anything.
 *
 * Rates stay per direction. A reverse with no rate of its own uses the one
 * that is set for the forward direction.
 */

/** One line of the pair editor and of a profile. Rates are text: what is typed. */
export interface PairRow {
  source_language: string;
  target_language: string;
  /** From `source_language` into `target_language`. Empty: the default rate. */
  rate_per_page: string;
  /** The other direction's own rate. Empty: the same as the one above. */
  reverse_rate_per_page: string;
  /** Only this direction; there is no reverse. */
  one_way: boolean;
}

/** A pair as the API takes it. */
export interface DirectedPair {
  source_language: string;
  target_language: string;
  rate_per_page: string | null;
  one_way?: boolean;
}

/** The directions stored for a translator, folded into one row per pair. */
export function groupPairs(pairs: readonly TranslatorLanguagePair[]): PairRow[] {
  const rows: PairRow[] = [];
  const byKey = new Map<string, PairRow>();
  for (const pair of pairs) {
    const reverse = byKey.get(`${pair.target_language}>${pair.source_language}`);
    if (reverse) {
      reverse.one_way = false;
      reverse.reverse_rate_per_page = pair.rate_per_page ?? "";
      continue;
    }
    const row: PairRow = {
      source_language: pair.source_language,
      target_language: pair.target_language,
      rate_per_page: pair.rate_per_page ?? "",
      reverse_rate_per_page: "",
      one_way: true,
    };
    rows.push(row);
    byKey.set(`${pair.source_language}>${pair.target_language}`, row);
  }
  return rows;
}

/** The rate a direction is paid at: its own, else the other direction's. */
export function reverseRate(row: Pick<PairRow, "rate_per_page" | "reverse_rate_per_page">): string {
  return row.reverse_rate_per_page || row.rate_per_page;
}

/** The pair-editor rows as the directions the API takes. */
export function pairsFromRows(rows: readonly PairRow[]): DirectedPair[] {
  return rows.flatMap((row) => {
    const forward: DirectedPair = {
      source_language: row.source_language,
      target_language: row.target_language,
      rate_per_page: row.rate_per_page,
    };
    if (row.one_way) return [{ ...forward, one_way: true }];
    // A reverse with its own rate is sent as a pair of its own; without one the
    // API adds it, rate empty.
    return row.reverse_rate_per_page.trim()
      ? [
          forward,
          {
            source_language: row.target_language,
            target_language: row.source_language,
            rate_per_page: row.reverse_rate_per_page,
          },
        ]
      : [forward];
  });
}

/**
 * What the API stores for these pairs: each followed by its reverse, unless it
 * is one way or the reverse is listed. Mirrors `both_ways` on the API.
 */
export function bothWays(pairs: readonly DirectedPair[]): DirectedPair[] {
  const listed = new Set(pairs.map((p) => `${p.source_language}>${p.target_language}`));
  const stored: DirectedPair[] = [];
  for (const pair of pairs) {
    stored.push({
      source_language: pair.source_language,
      target_language: pair.target_language,
      rate_per_page: pair.rate_per_page,
    });
    const reverse = `${pair.target_language}>${pair.source_language}`;
    if (!pair.one_way && !listed.has(reverse)) {
      listed.add(reverse);
      stored.push({
        source_language: pair.target_language,
        target_language: pair.source_language,
        rate_per_page: null,
      });
    }
  }
  return stored;
}
