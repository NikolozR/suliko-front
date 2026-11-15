// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { unstable_rethrow } from "next/navigation";

import { ApiError } from "@office/shared/lib/api";

/**
 * Read an endpoint that may not exist on the deployed API yet.
 *
 * ## Why this exists
 *
 * The frontend deploys to Vercel on push; the API is a manual pull on the
 * bureau's server. The two are therefore *always* out of step for a window,
 * and during that window a screen calling an endpoint the API does not serve
 * yet would throw out of a Server Component — which Next renders as a blank
 * page and an opaque digest. That is the worst possible failure mode: it
 * tells the user nothing and it takes down the whole route, including the
 * parts that would have worked.
 *
 * So: a missing or unreachable endpoint degrades to `null` and the page
 * renders an explanation. A *broken* one still throws.
 *
 * ## What is NOT tolerated
 *
 * 401 and 403 propagate. An expired session must reach the redirect in
 * `guards.ts`, and a permission failure means the UI is showing something it
 * should not — both are bugs to surface, not conditions to paper over.
 *
 * ## The 404 ambiguity
 *
 * `core/gateway.py` answers a bad `X-Suliko-Gateway` secret with a flat 404,
 * deliberately indistinguishable from a route that does not exist. So a 404
 * here means either "the API is behind" or "BFF_SHARED_SECRET is wrong", and
 * the message below names both rather than guessing.
 */

export type Unavailable = {
  /**
   * `schema` is the one the operator can fix in a single command, so it is
   * kept distinct from a generic `failing`. The API returns it as a 503 with
   * the code `schema_out_of_date` when a query hits a table or column the
   * running build expects and the database does not have — which is what
   * happens whenever the frontend has deployed and `alembic upgrade head` has
   * not been run yet.
   */
  reason: "missing" | "unreachable" | "failing" | "schema" | "forbidden";
  detail: string;
};

export type Tolerated<T> = { data: T; error: null } | { data: null; error: Unavailable };

export async function tolerate<T>(promise: Promise<T>): Promise<Tolerated<T>> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    // A redirect (the step-up one in `api()`) is control flow, not a failure.
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      // Auth and permission failures are real; let them reach the boundary.
      // A missing permission for ONE block of a page (an owner can untick
      // "See reports" for someone, and the dashboard reads reports) is not a
      // reason to fail the whole page. The block says so and the rest renders.
      if (error.status === 403 && error.code === "permission_denied") {
        return { data: null, error: { reason: "forbidden", detail: error.detail } };
      }
      // Anything else auth-shaped is real; let it reach the boundary.
      if (error.status === 401 || error.status === 403) throw error;

      if (error.status === 404) {
        return {
          data: null,
          error: {
            reason: "missing",
            detail:
              "The API did not recognise this endpoint. Either it is running an " +
              "older build than this frontend, or BFF_SHARED_SECRET does not match.",
          },
        };
      }

      if (error.code === "schema_out_of_date") {
        return {
          data: null,
          // The API's own detail already names the missing object and the
          // command that fixes it, so it is passed through rather than
          // replaced with something vaguer.
          error: { reason: "schema", detail: error.detail },
        };
      }

      if (error.status >= 500) {
        return {
          data: null,
          error: {
            reason: "failing",
            detail: `The API returned ${error.status}. ${error.detail}`,
          },
        };
      }

      // 4xx that is none of the above — a genuine bad request from us.
      throw error;
    }

    // Not an ApiError at all: DNS failure, TLS failure, connection refused,
    // or API_BASE_URL unset. `fetch` throws a TypeError for all of these.
    return {
      data: null,
      error: {
        reason: "unreachable",
        detail:
          error instanceof Error && error.message.includes("API_BASE_URL")
            ? error.message
            : "Could not reach the API at all.",
      },
    };
  }
}
