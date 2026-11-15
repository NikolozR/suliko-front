// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

/**
 * How long a server-side read took, in the server's log.
 *
 * Off unless `LOG_TIMINGS=1` is set, so it costs nothing in normal running.
 * Turn it on to find which call a slow page is waiting for:
 *
 *   [timing] order 152: comments 3912ms
 *
 * The promise comes back unchanged: same value, same rejection.
 */
const ENABLED = process.env.LOG_TIMINGS === "1";

export function timed<T>(label: string, work: Promise<T>): Promise<T> {
  if (!ENABLED) return work;
  const started = performance.now();
  return work.finally(() => {
    console.info(`[timing] ${label} ${Math.round(performance.now() - started)}ms`);
  });
}

/**
 * For a read that is started now and awaited later, inside a `<Suspense>`.
 *
 * If it fails before the component that awaits it has rendered, nothing is
 * listening yet and Node reports an unhandled rejection. This listens, and
 * changes nothing else: whoever awaits the promise still gets the failure.
 */
export function startEarly<T>(work: Promise<T>): Promise<T> {
  work.catch(() => {});
  return work;
}
