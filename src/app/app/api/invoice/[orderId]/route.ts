// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { apiRaw } from "@office/shared/lib/api";

/**
 * An order's invoice as Word, in the bureau's own uploaded file.
 *
 * A download is a browser navigation and the session token is in an HttpOnly
 * cookie only this server can read, so the browser asks here and this forwards
 * the request with the credentials, like `api/files`. Nothing is authorised
 * here: the API checks the session and the order. It answers 404 when the
 * bureau has uploaded no file, which the invoice screen never offers.
 */

const ID = /^\d{1,12}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  const { orderId } = await params;
  if (!ID.test(orderId)) return new Response("Not found", { status: 404 });
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ka";

  let upstream: Response;
  try {
    upstream = await apiRaw(`/api/v1/orders/${orderId}/invoice.docx?locale=${locale}`);
  } catch {
    return new Response("The service is not reachable right now. Try again shortly.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.json().then((body: { detail?: string }) => body.detail).catch(() => "");
    return new Response(detail || "The invoice could not be made. Try again in a moment.", {
      status: [401, 404, 409].includes(upstream.status) ? upstream.status : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of ["content-type", "content-disposition", "content-length"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers });
}
