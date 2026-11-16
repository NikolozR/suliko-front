// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { apiRaw } from "@office/shared/lib/api";

/**
 * Download one document file, streamed through from the API.
 *
 * The app's only route handler, and it exists for one reason: a download is a
 * browser navigation, and the browser does not hold the session token — it
 * lives in an HttpOnly cookie that only this server can read. So the browser
 * asks here, and this forwards the request with the credentials attached.
 *
 * Nothing is authorised here. The API checks the session, the order, the
 * document, and that the file really belongs to that document — which is the
 * check that stops a guessed file id from reaching another bureau's files.
 * This handler only refuses input that is not even shaped like an id, before
 * spending a request on it.
 *
 * Outside `[locale]` on purpose: `middleware.ts` skips `/api`, so this is not
 * locale-prefixed and does not get the page CSP, neither of which a file
 * download wants.
 */

const ID = /^\d{1,12}$/;
const FILE_ID = /^[A-Za-z0-9_-]{8,100}$/;

/** Headers worth passing on. Everything else stays between us and the API. */
const FORWARDED = ["content-type", "content-disposition", "content-length", "x-content-type-options"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; documentId: string; fileId: string }> },
): Promise<Response> {
  const { orderId, documentId, fileId } = await params;

  if (!ID.test(orderId) || !ID.test(documentId) || !FILE_ID.test(fileId)) {
    return new Response("Not found", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await apiRaw(
      `/api/v1/orders/${orderId}/documents/${documentId}/files/${encodeURIComponent(fileId)}`,
    );
  } catch {
    // Connection refused, DNS, a missing API_BASE_URL: none of it is the
    // browser's business, and a bare 500 tells the person clicking nothing.
    return new Response("The file service is not reachable right now. Try again shortly.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    // The API's problem+json is for us, not for a browser tab. A short plain
    // sentence is what somebody who clicked a link should see.
    const message =
      upstream.status === 401
        ? "Your session has ended. Sign in again, then retry the download."
        : upstream.status === 404
          ? "That file is no longer there."
          : "The file could not be downloaded. Try again in a moment.";
    return new Response(message, {
      status: upstream.status === 401 || upstream.status === 404 ? upstream.status : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of FORWARDED) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: 200, headers });
}
