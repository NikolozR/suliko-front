/**
 * How far along a running translation is, for the bar on the document page.
 *
 * Two honest sources, never a made-up number:
 *  - a long document is translated in sections and the server says how many
 *    are back, so the bar follows that exactly (`estimated: false`);
 *  - a document sent as one request has no signal until it finishes, so the bar
 *    follows elapsed time against the expected duration and says so
 *    (`estimated: true`). It levels off below the end, because the job is not
 *    done until the server says it is.
 *
 * The bar never goes backwards: callers keep the highest value seen.
 */

export interface ProgressInput {
  stage: string | null;
  sectionsDone: number | null;
  sectionsTotal: number | null;
  elapsedMs: number;
  expectedMs: number;
}

export interface ProgressResult {
  percent: number;
  /** True when the figure comes from elapsed time rather than from the job. */
  estimated: boolean;
}

/** Share of the bar given to translating; the rest is set-up and building the file. */
const TRANSLATING_START = 8;
const TRANSLATING_SPAN = 82;
const TRANSLATING_CAP = 90;

export function computeProgress({
  stage,
  sectionsDone,
  sectionsTotal,
  elapsedMs,
  expectedMs,
}: ProgressInput): ProgressResult {
  if (stage === "ready") return { percent: 100, estimated: false };
  if (stage === "rebuilding") return { percent: 95, estimated: false };
  if (stage === "queued" || !stage) return { percent: 4, estimated: false };

  // translating (or the retired "verifying", which is the same wait)
  if (sectionsTotal && sectionsTotal > 0 && sectionsDone !== null) {
    const done = Math.min(sectionsDone, sectionsTotal);
    return {
      percent: TRANSLATING_START + (TRANSLATING_SPAN * done) / sectionsTotal,
      estimated: false,
    };
  }

  const expected = expectedMs > 0 ? expectedMs : 60_000;
  const fraction = 1 - Math.exp(-Math.max(0, elapsedMs) / expected);
  return {
    percent: Math.min(TRANSLATING_CAP, TRANSLATING_START + TRANSLATING_SPAN * fraction),
    estimated: true,
  };
}

/** True once a job has run well past what was expected, so the page can say so. */
export function isRunningLong(elapsedMs: number, expectedMs: number): boolean {
  return expectedMs > 0 && elapsedMs > expectedMs * 1.5 + 30_000;
}
