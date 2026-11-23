/** Statuses that say the server is busy or briefly unavailable, not that the request is wrong. */
const TRANSIENT = new Set([429, 502, 503, 504]);

/**
 * One more attempt after a short pause when the request fails the way a restart or an overloaded
 * proxy makes it fail: a network error, or 429/502/503/504. Without it a single hiccup returned
 * null from the analysis, and the submit path then fell back to the old name search, which takes
 * minutes on a long document. A request that was cancelled on purpose (a new file or language)
 * is never repeated.
 */
export async function sendWithOneRetry(
  send: (bearer: string) => Promise<Response>,
  bearer: string,
  signal?: AbortSignal,
  pauseMs = 1500
): Promise<Response> {
  try {
    const response = await send(bearer);
    if (!TRANSIENT.has(response.status)) return response;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
  }
  await new Promise((resolve) => setTimeout(resolve, pauseMs));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return send(bearer);
}
