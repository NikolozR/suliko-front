/**
 * Single source of truth for "how long will this document take, and what will
 * it cost".
 *
 * Three different formulas used to live in three different files — the loading
 * hook used `pages * 30s`, the submit card's countdown used
 * `4min + (pages - 1) * 25s`, and the wait page used `pages * 2min`. The same
 * document could therefore be quoted two contradictory ETAs inside one session.
 *
 * The per-page duration is *learned*: every completed translation records its
 * real seconds-per-page, and the estimate uses the rolling median of recent
 * samples. A median (not a mean) so one pathological 20-minute run doesn't drag
 * every later estimate with it. Until the user has finished a few documents we
 * fall back to the default.
 */

const STORAGE_KEY = "suliko:translation-duration-samples";

/** Keep the window short so the estimate tracks current backend performance. */
const MAX_SAMPLES = 20;
/** Below this many samples the median is noise, so keep using the default. */
const MIN_SAMPLES = 3;
const DEFAULT_SECONDS_PER_PAGE = 30;

/** Guard rails: a single absurd sample must not poison future estimates. */
const MIN_SECONDS_PER_PAGE = 5;
const MAX_SECONDS_PER_PAGE = 300;

/** Even a one-page document pays fixed upload + queue + finalize overhead. */
const FLOOR_MS = 60_000;
const COST_PER_PAGE = 0.1;

const isBrowser = () => typeof window !== "undefined";

function readSamples(): number[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      .slice(-MAX_SAMPLES);
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — fall back silently.
    return [];
  }
}

function writeSamples(samples: number[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(samples.slice(-MAX_SAMPLES))
    );
  } catch {
    /* storage unavailable — estimates just stay at the default */
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Record how long a finished translation actually took, so future estimates
 * converge on what this user's documents really cost in wall-clock time.
 * Safe to call more than once for the same job — duplicates only sharpen the
 * median slightly, they can't corrupt it.
 */
export function recordTranslationDuration(
  pageCount: number,
  elapsedMs: number
): void {
  if (!isBrowser()) return;
  if (!Number.isFinite(pageCount) || pageCount <= 0) return;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;

  const secondsPerPage = elapsedMs / 1000 / pageCount;
  if (
    secondsPerPage < MIN_SECONDS_PER_PAGE ||
    secondsPerPage > MAX_SECONDS_PER_PAGE
  ) {
    return; // outside plausible range — almost certainly a stale or resumed page
  }

  writeSamples([...readSamples(), secondsPerPage]);
}

/** The learned per-page duration, or the default while we're still calibrating. */
export function getSecondsPerPage(): number {
  const samples = readSamples();
  if (samples.length < MIN_SAMPLES) return DEFAULT_SECONDS_PER_PAGE;
  return median(samples);
}

/** True once the estimate is based on this user's own completed translations. */
export function hasCalibratedEstimate(): boolean {
  return readSamples().length >= MIN_SAMPLES;
}

/** Total expected wall-clock duration for a document, in milliseconds. */
export function estimateDurationMs(pageCount: number): number {
  const pages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 0;
  if (pages === 0) return 4 * 60 * 1000;
  return Math.max(FLOOR_MS, pages * getSecondsPerPage() * 1000);
}

/** Expected duration in whole minutes, for display. Always at least 1. */
export function estimateMinutes(pageCount: number): number {
  return Math.max(1, Math.round(estimateDurationMs(pageCount) / 60_000));
}

/** Expected price, formatted to two decimals. */
export function estimateCost(pageCount: number): string {
  const pages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 0;
  return (pages * COST_PER_PAGE).toFixed(2);
}
