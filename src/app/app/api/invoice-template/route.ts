// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { apiRaw } from "@office/shared/lib/api";

/**
 * The bureau's uploaded invoice file: `?which=file` as uploaded, `?which=sample`
 * filled with an invented invoice (add `&locale=en` for English), so a file can
 * be checked before a client sees it. The API only lets people who manage
 * settings through.
 */
export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const path =
    query.get("which") === "sample"
      ? `/api/v1/invoice-template/sample?locale=${query.get("locale") === "en" ? "en" : "ka"}`
      : "/api/v1/invoice-template/file";

  let upstream: Response;
  try {
    upstream = await apiRaw(path);
  } catch {
    return new Response("The service is not reachable right now. Try again shortly.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("The file could not be downloaded.", {
      status: [401, 403, 404].includes(upstream.status) ? upstream.status : 502,
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
