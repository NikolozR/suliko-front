// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { apiRaw } from "@office/shared/lib/api";

/**
 * Download a CSV export, streamed through from the API.
 *
 * A route handler for the same reason as `/api/files`: a download is a plain
 * browser navigation, and the session token lives in an HttpOnly cookie only
 * this server can read. Nothing is authorised here — the API checks the
 * permission for each export (and leaves the profit column out for anyone
 * without `reports.profit`); this only maps the list screen's query onto the
 * export's and refuses anything that is not one of the four exports.
 */

const RESOURCES = new Set(["orders", "clients", "payments", "expenses"]);

/** Parameters each export accepts, as the list screens name them. */
const PASSED: Record<string, readonly string[]> = {
  orders: ["search", "client_type", "status", "language", "client_id", "date_from", "date_to", "sort"],
  clients: ["search", "client_type"],
  payments: ["client_id", "start", "end", "method", "search"],
  expenses: ["start", "end", "category", "search"],
};

/** The orders list's one-click tabs are flags on the API. */
const QUICK: Record<string, string> = {
  overdue: "overdue",
  dueToday: "due_today",
  unpaid: "unpaid",
  mine: "mine",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
): Promise<Response> {
  const { resource } = await params;
  if (!RESOURCES.has(resource)) return new Response("Not found", { status: 404 });

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of PASSED[resource]) {
    const value = incoming.get(key);
    if (value && value.length <= 255) query.set(key, value);
  }
  const quick = QUICK[incoming.get("quick") ?? ""];
  if (resource === "orders" && quick) query.set(quick, "true");
  query.set("lang", incoming.get("lang") === "en" ? "en" : "ka");

  let upstream: Response;
  try {
    upstream = await apiRaw(`/api/v1/exports/${resource}.csv?${query}`, {
      // An export pages through the whole list; give it longer than a page load.
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return new Response("The export service is not reachable right now. Try again shortly.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const message =
      upstream.status === 401
        ? "Your session has ended. Sign in again, then retry the export."
        : upstream.status === 403
          ? "You do not have access to this export."
          : "The export could not be produced. Try again in a moment.";
    return new Response(message, {
      status: upstream.status === 401 || upstream.status === 403 ? upstream.status : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of ["content-type", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers });
}
