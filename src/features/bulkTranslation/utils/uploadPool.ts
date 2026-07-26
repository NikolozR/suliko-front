/**
 * Runs async tasks with a bounded number in flight.
 *
 * Uploading a folder is the one place this app can accidentally start fifty concurrent
 * multi-megabyte requests. Browsers cap connections per host anyway, so the extra requests
 * would just queue invisibly — but each one holds its File in memory and its own progress
 * state, and the queued ones report no progress at all, which reads as a hang.
 */
export const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  };

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    worker
  );

  await Promise.all(workers);
  return results;
};

/**
 * How many files upload at once.
 *
 * Chrome allows six connections per host and the upload goes straight to Google, so beyond
 * six the extra transfers stall behind the others while still looking active. Four leaves
 * headroom for the page-count and status-polling requests happening alongside.
 */
export const UPLOAD_CONCURRENCY = 4;

/** Page counting is cheap for PDFs but hits the API for other formats; keep it modest. */
export const PAGE_COUNT_CONCURRENCY = 4;
