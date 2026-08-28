/**
 * Partner Order API proxy — handoff §A.1.
 *
 * Why it exists: the partner's `X-Api-Key` is static and *cannot be rotated
 * without breaking the old one*, so it must never ship in a JS bundle. The
 * browser talks to this route; this route holds the key.
 *
 * The core design rule is pass-through: upstream status codes and bodies are
 * returned unchanged, so the client's error handling behaves identically
 * whether or not the proxy is in the path. Never rewrite a 422's `errors[]`,
 * never turn a 503 into a 500, never invent a success.
 *
 * Env:
 *   NOTARY_ORDER_API_KEY   required — missing ⇒ every call 500s, with a log line
 *   NOTARY_ORDER_API_URL   optional — defaults to https://app.tarjimnebi.ge/api
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPSTREAM_BASE =
  process.env.NOTARY_ORDER_API_URL?.trim() || 'https://app.tarjimnebi.ge/api';

/** Matches the partner's own `order_files.php` cap. The UI promises 10 MB. */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Must stay below the client's 120 s UPLOAD_TIMEOUT. */
const UPSTREAM_TIMEOUT_MS = 90_000;

/** In-isolate reference cache. Isolates are short-lived, so this is not a CDN —
 *  it collapses bursts from a page full of visitors. */
const REFERENCE_TTL_MS = 60 * 60 * 1000;

const ROUTES = {
  reference: { upstream: 'reference.php', method: 'GET' },
  orders: { upstream: 'orders.php', method: 'POST' },
  files: { upstream: 'order_files.php', method: 'POST' },
} as const;

type RouteName = keyof typeof ROUTES;

let referenceCache: { savedAt: number; body: string; contentType: string } | null = null;

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

function apiKey(): string | null {
  return process.env.NOTARY_ORDER_API_KEY?.trim() || null;
}

/** Return the upstream response verbatim — status, body and content type. */
async function passThrough(upstream: Response) {
  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': contentType },
  });
}

/** Routing is the last non-empty path segment, so the client's route name is ours. */
function resolveRoute(segments: string[] | undefined): RouteName | null {
  const last = [...(segments ?? [])].reverse().find((s) => s && s.trim() !== '');
  return last && last in ROUTES ? (last as RouteName) : null;
}

// ---------------------------------------------------------------------------

async function handleReference(key: string, forceRefresh: boolean) {
  // `?refresh=1` skips the cache and refills it. The partner asks not to be
  // polled hard, so this is a deliberate manual action — for use right after
  // editing the catalogue on their side, rather than waiting out the TTL.
  if (!forceRefresh && referenceCache && Date.now() - referenceCache.savedAt < REFERENCE_TTL_MS) {
    return new NextResponse(referenceCache.body, {
      status: 200,
      headers: { 'Content-Type': referenceCache.contentType, 'X-Proxy-Cache': 'HIT' },
    });
  }

  const upstream = await fetch(`${UPSTREAM_BASE}/${ROUTES.reference.upstream}`, {
    method: 'GET',
    headers: { 'X-Api-Key': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    cache: 'no-store',
  });

  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  const body = await upstream.text();

  // Only cache a success. A failure must never be held for an hour.
  if (upstream.ok) {
    referenceCache = { savedAt: Date.now(), body, contentType };
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'X-Proxy-Cache': forceRefresh ? 'BYPASS' : 'MISS',
    },
  });
}

async function handleOrders(request: NextRequest, key: string) {
  // Forwarded verbatim — the proxy has no opinion about the order's shape.
  const body = await request.text();

  const upstream = await fetch(`${UPSTREAM_BASE}/${ROUTES.orders.upstream}`, {
    method: 'POST',
    headers: {
      'X-Api-Key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  return passThrough(upstream);
}

async function handleFiles(request: NextRequest, key: string) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return json({ success: false, error: 'Expected multipart/form-data.' }, 415);
  }

  // The body is buffered, not streamed: a streamed body goes upstream chunked
  // without a Content-Length, and PHP's multipart parser cannot be relied on to
  // accept that. The cost is that the two hops are serialised — which is why
  // receive time and upstream time are measured separately below. That split is
  // what tells a slow client link apart from a slow partner.
  const receiveStart = Date.now();
  const buffer = await request.arrayBuffer();
  const receiveMs = Date.now() - receiveStart;

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    console.warn(`[notary-order] upload rejected — ${buffer.byteLength} bytes over cap`);
    return json({ success: false, error: 'File is too large.' }, 413);
  }

  const upstreamStart = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(`${UPSTREAM_BASE}/${ROUTES.files.upstream}`, {
      method: 'POST',
      headers: {
        'X-Api-Key': key,
        // Forwarded verbatim — the multipart boundary lives in this header, and
        // re-encoding the form here would only risk corrupting it.
        'Content-Type': contentType,
        Accept: 'application/json',
      },
      body: buffer,
      // Without this the fetch can hang indefinitely while the browser gives up
      // on its own — a failure mode that logs nothing at all.
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(
        `[notary-order] file upload timeout — ${buffer.byteLength} bytes, ` +
          `${receiveMs}ms receive, ${Date.now() - upstreamStart}ms upstream`
      );
      return json({ success: false, error: 'File storage did not respond in time.' }, 504);
    }
    throw error;
  }

  const upstreamMs = Date.now() - upstreamStart;
  // Logged on success as well as failure: a silent function is
  // indistinguishable from a hung one, which is the case worth diagnosing.
  console.log(
    `[notary-order] file upload ${upstream.status} — ${buffer.byteLength} bytes, ` +
      `${receiveMs}ms receive, ${upstreamMs}ms upstream`
  );

  return passThrough(upstream);
}

// ---------------------------------------------------------------------------

async function handle(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> }
) {
  const { route: segments } = await context.params;
  const route = resolveRoute(segments);

  if (!route) {
    return json({ success: false, error: 'Unknown endpoint.' }, 404);
  }

  if (request.method !== ROUTES[route].method) {
    return json({ success: false, error: 'Method not allowed.' }, 405);
  }

  const key = apiKey();
  if (!key) {
    console.error('[notary-order] NOTARY_ORDER_API_KEY is not set');
    return json({ success: false, error: 'Order service is not configured.' }, 500);
  }

  try {
    if (route === 'reference') {
      const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';
      return await handleReference(key, forceRefresh);
    }
    if (route === 'orders') return await handleOrders(request, key);
    return await handleFiles(request, key);
  } catch (error) {
    console.error(`[notary-order] ${route} failed:`, error);
    return json(
      {
        success: false,
        error:
          route === 'files'
            ? 'We could not store the file. Please email it to us instead.'
            : 'The order service is unavailable. Please retry or contact support.',
      },
      502
    );
  }
}

export const GET = handle;
export const POST = handle;
