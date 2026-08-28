/**
 * Order wizard constants — handoff §5, §8.
 *
 * Deliberately separate from the components so the limits enforced in the UI,
 * the limits enforced in the proxy and the limits promised in the copy all read
 * from one place.
 */

/** Proxy route the browser talks to. The partner key never reaches the client. */
export const ORDER_API_BASE = '/api/notary-order';

/** §5.2 — the UI promises 10 MB; the proxy's own cap is 50 MB. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_DOCUMENT = 5;

/**
 * Checked in JS, not just via `accept=` — drag-drop bypasses `accept`, and an
 * unsupported file would otherwise 422 *after* the order is already placed.
 */
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] as const;
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.join(',');

export const MIN_PAGES = 1;
export const MAX_PAGES = 2000;

export const DEFAULT_URGENCY = 'standard';
export const DEFAULT_HANDOVER = ['scan'];

/** §5.4 — constant, tells the partner which front end the order came from. */
/**
 * Sent as `acquisition_source`. Note this is NOT a documented field — the
 * partner accepts it and ignores it (unknown fields never appear in their 422s,
 * while recognised ones do). It is kept in case they ever start reading it, but
 * it must not be relied on: the notes line below is what staff actually see.
 */
export const ACQUISITION_SOURCE = 'suliko.ge/notary';

/** Brand marker for the notes body — see `buildNotes`. */
export const ORDER_SOURCE_LABEL = 'SULIKO';
export const ORDER_SOURCE_SITE = 'suliko.ge/notary';

/**
 * §5.4 — client-generated reference prefix. The Telegram bot uses `TG-`, and
 * notarytranslation.ge uses `NT-`.
 *
 * `SL-` is ours: the partner account is shared with notarytranslation.ge, and
 * since `acquisition_source` is ignored, the reference is one of only two
 * places the origin is visible at all. An `NT-` prefix here would actively
 * mislabel Suliko orders as theirs.
 *
 * The API has no client-type field either, so the segment rides here too —
 * `SL-B2B-…` vs `SL-B2C-…`.
 */
export const REFERENCE_PREFIX = 'SL';
export const SEGMENT_PREFIX = { business: 'B2B', individual: 'B2C' } as const;

/** §8 — client-side timeouts. The proxy aborts upstream at 90 s. */
export const JSON_TIMEOUT_MS = 20_000;
export const UPLOAD_TIMEOUT_MS = 120_000;

/** §5.5 — only 503 is retried, with these delays. */
export const UPLOAD_RETRY_DELAYS_MS = [2000, 5000];

/**
 * In-memory catalogue cache. Short on purpose: the proxy's own 1 h server-side
 * cache is what protects the partner from being polled, so this only needs to
 * stop a single page from refetching on every tab switch. A long TTL here just
 * hides catalogue edits from a tab that has been open a while.
 */
export const REFERENCE_MEMORY_TTL_MS = 5 * 60 * 1000;

/** Removed cache key, still purged from returning visitors' sessionStorage. */
export const LEGACY_REFERENCE_CACHE_KEY = 'nt.order.reference.v1';

export const SUPPORT_EMAIL = 'info@th.com.ge';

/**
 * Tailwind purges dynamic class names, so `grid-cols-${n}` is written out.
 * (§16.9 — this is the exact bug the lookup exists to avoid.)
 */
export const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * `NT-<YYYYMMDDHHMMSS>-<5 random chars>`, generated once per order attempt.
 *
 * The partner API has no idempotency key, so this is the only way to reconcile
 * an ambiguous timeout with them (§16.1).
 */
export function generateExternalReference(prefix: string = REFERENCE_PREFIX): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `${prefix}-${stamp}-${suffix}`;
}
