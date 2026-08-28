/**
 * Order API client — handoff §3.3, §5.4, §5.5, §5.6.
 *
 * Talks to the local proxy at `/api/notary-order/*`, never to the partner
 * directly: the partner's `X-Api-Key` is static, cannot be rotated without
 * breaking the old one, and must never ship in a JS bundle.
 *
 * The whole wizard branches on `OrderApiError.kind` / `.ambiguous`, so those
 * two fields are the contract — keep them if you port this anywhere.
 */

import {
  JSON_TIMEOUT_MS,
  ORDER_API_BASE,
  UPLOAD_RETRY_DELAYS_MS,
  UPLOAD_TIMEOUT_MS,
} from './notaryOrderConfig';

export type OrderApiErrorKind =
  | 'auth'
  | 'notfound'
  | 'toolarge'
  | 'validation'
  | 'unavailable'
  | 'server'
  | 'network'
  | 'unsupported'
  | 'unknown';

export class OrderApiError extends Error {
  readonly kind: OrderApiErrorKind;
  readonly status: number | null;
  /** Field errors from a 422, rendered inline by the wizard. */
  readonly errors: string[];
  /**
   * True when we cannot know whether the server wrote anything — a timeout or
   * a dropped connection on a POST. Never auto-retry one of these.
   */
  readonly ambiguous: boolean;

  constructor(
    message: string,
    options: {
      kind: OrderApiErrorKind;
      status?: number | null;
      errors?: string[];
      ambiguous?: boolean;
    }
  ) {
    super(message);
    this.name = 'OrderApiError';
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.errors = options.errors ?? [];
    this.ambiguous = options.ambiguous ?? false;
  }
}

/** §3.3 — the status → meaning contract used everywhere. */
export function kindForStatus(status: number): OrderApiErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'notfound';
  if (status === 413) return 'toolarge';
  if (status === 422) return 'validation';
  if (status === 503) return 'unavailable';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Only 503 is safe to retry — it is the one status where nothing was written. */
export function isRetryable(error: unknown): boolean {
  return error instanceof OrderApiError && error.kind === 'unavailable';
}

// ---------------------------------------------------------------------------
// Reference data (§3.3)
// ---------------------------------------------------------------------------

export interface ReferenceLanguage {
  language_code: string;
  language_name: string;
  language_name_georgian?: string;
}

export interface ReferenceLanguagePair {
  language_pair: string;
  source_language: string;
  target_language: string;
  price_per_page: number;
}

export interface ReferenceDocumentType {
  type_id: number;
  type_name: string;
  type_name_georgian?: string;
  price_multiplier: number;
}

export interface ReferenceCopyType {
  value: string;
  label: string;
  notarized: boolean;
}

export interface ReferenceUrgencyLevel {
  value: string;
  label: string;
  multiplier: number;
}

export interface ReferenceHandoverMethod {
  value: string;
  label: string;
  extra_cost: number;
  requires_address?: boolean;
}

export interface OrderReference {
  currency: string;
  languages: ReferenceLanguage[];
  language_pairs: ReferenceLanguagePair[];
  document_types: ReferenceDocumentType[];
  copy_types: ReferenceCopyType[];
  urgency_levels: ReferenceUrgencyLevel[];
  handover_methods: ReferenceHandoverMethod[];
}

// ---------------------------------------------------------------------------
// Order payload / response (§5.4)
// ---------------------------------------------------------------------------

export interface OrderDocumentPayload {
  language_pair: string;
  document_type: number;
  page_count: number;
  copy_type: string;
}

export interface OrderPayload {
  external_reference: string;
  acquisition_source: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
  };
  urgency: string;
  handover_methods: string[];
  documents: OrderDocumentPayload[];
  notes: string;
}

export interface OrderResponseDocument {
  document_id: number;
  language_pair: string;
  page_count: number;
  price: number;
}

export interface OrderResult {
  order_id: number | string;
  total: number;
  currency: string;
  due_date?: string;
  status?: string;
  /**
   * Optional — older partner deployments omit it. No `documents` array means
   * no `document_id`, which means uploads are unavailable for that deployment.
   * Degrade; never assume it is there (§16.4).
   */
  documents?: OrderResponseDocument[];
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

interface ApiEnvelope {
  success?: boolean;
  error?: string;
  message?: string;
  errors?: unknown;
}

function extractErrors(body: ApiEnvelope | null): string[] {
  if (!body) return [];
  if (Array.isArray(body.errors)) return body.errors.map((e) => String(e));
  if (body.errors && typeof body.errors === 'object') {
    return Object.values(body.errors as Record<string, unknown>).flatMap((v) =>
      Array.isArray(v) ? v.map(String) : [String(v)]
    );
  }
  return [];
}

function messageFor(body: ApiEnvelope | null, fallback: string): string {
  return body?.error ?? body?.message ?? fallback;
}

async function readJson(response: Response): Promise<ApiEnvelope | null> {
  try {
    return (await response.json()) as ApiEnvelope;
  } catch {
    return null;
  }
}

/**
 * One request through the proxy.
 *
 * `ambiguousOnNetworkError` is set for POSTs: when the connection drops we
 * cannot know whether the order was written, and the caller must not offer a
 * blind retry.
 */
async function request<T>(
  path: string,
  init: RequestInit,
  options: { timeoutMs: number; ambiguousOnNetworkError: boolean }
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${ORDER_API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    throw new OrderApiError(
      error instanceof Error && error.name === 'AbortError'
        ? 'The request timed out.'
        : 'Network error.',
      { kind: 'network', ambiguous: options.ambiguousOnNetworkError }
    );
  } finally {
    clearTimeout(timer);
  }

  const body = await readJson(response);

  if (!response.ok) {
    throw new OrderApiError(messageFor(body, `Request failed (${response.status}).`), {
      kind: kindForStatus(response.status),
      status: response.status,
      errors: extractErrors(body),
    });
  }

  // The partner answers `{ success: false }` on HTTP 200 too — treat it as an
  // error, or a rejected order reads as a placed one.
  if (body && body.success === false) {
    throw new OrderApiError(messageFor(body, 'The request was rejected.'), {
      kind: 'server',
      status: response.status,
      errors: extractErrors(body),
    });
  }

  return body as T;
}

export async function fetchReference(): Promise<OrderReference> {
  const body = await request<OrderReference & ApiEnvelope>(
    '/reference',
    { method: 'GET', headers: { Accept: 'application/json' } },
    { timeoutMs: JSON_TIMEOUT_MS, ambiguousOnNetworkError: false }
  );

  return {
    currency: body.currency ?? '₾',
    languages: body.languages ?? [],
    language_pairs: body.language_pairs ?? [],
    document_types: body.document_types ?? [],
    copy_types: body.copy_types ?? [],
    urgency_levels: body.urgency_levels ?? [],
    handover_methods: body.handover_methods ?? [],
  };
}

export async function submitOrder(payload: OrderPayload): Promise<OrderResult> {
  const body = await request<OrderResult & ApiEnvelope>(
    '/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    },
    { timeoutMs: JSON_TIMEOUT_MS, ambiguousOnNetworkError: true }
  );

  return body;
}

// ---------------------------------------------------------------------------
// File upload (§5.5)
// ---------------------------------------------------------------------------

export interface UploadQueueItem {
  key: string;
  documentPosition: number;
  /** `null` when the partner returned no `documents` array — nothing to attach to. */
  documentId: number | null;
  file: File;
}

export interface UploadFailure {
  key: string;
  fileName: string;
  kind: OrderApiErrorKind;
  message: string;
  retryable: boolean;
}

export interface UploadOutcome {
  uploaded: UploadQueueItem[];
  failed: UploadFailure[];
}

/**
 * Pair each file with the `document_id` the partner assigned. The queue is
 * built by position: `documents[i]` in the response corresponds to
 * `documents[i]` as submitted.
 */
export function buildUploadQueue(
  submitted: Array<{ files: File[] }>,
  responseDocuments: OrderResponseDocument[] | undefined
): UploadQueueItem[] {
  const queue: UploadQueueItem[] = [];

  submitted.forEach((doc, position) => {
    const documentId = responseDocuments?.[position]?.document_id ?? null;
    doc.files.forEach((file, fileIndex) => {
      queue.push({
        key: `${position}-${fileIndex}-${file.name}`,
        documentPosition: position,
        documentId,
        file,
      });
    });
  });

  return queue;
}

async function uploadOne(
  orderId: number | string,
  item: UploadQueueItem
): Promise<void> {
  const form = new FormData();
  form.append('order_id', String(orderId));
  form.append('document_id', String(item.documentId));
  form.append('file', item.file, item.file.name);

  await request(
    '/files',
    { method: 'POST', body: form },
    { timeoutMs: UPLOAD_TIMEOUT_MS, ambiguousOnNetworkError: false }
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload every queued file, one at a time. **Never throws.**
 *
 * An upload failure can never make a placed order look failed (§16.2), so
 * every outcome comes back as data for the confirmation panel to render.
 * Only 503 is retried, with the configured delays.
 */
export async function uploadOrderFiles(
  orderId: number | string,
  queue: UploadQueueItem[],
  onProgress?: (done: number, total: number, current: UploadQueueItem) => void
): Promise<UploadOutcome> {
  const uploaded: UploadQueueItem[] = [];
  const failed: UploadFailure[] = [];

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    onProgress?.(index, queue.length, item);

    // No document_id means this deployment cannot accept files at all. Not
    // retryable — there is nothing to attach them to.
    if (item.documentId === null) {
      failed.push({
        key: item.key,
        fileName: item.file.name,
        kind: 'unsupported',
        message: 'File upload is not available for this order.',
        retryable: false,
      });
      continue;
    }

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= UPLOAD_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        await uploadOne(orderId, item);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === UPLOAD_RETRY_DELAYS_MS.length) break;
        await sleep(UPLOAD_RETRY_DELAYS_MS[attempt]);
      }
    }

    if (lastError) {
      const apiError =
        lastError instanceof OrderApiError
          ? lastError
          : new OrderApiError('Upload failed.', { kind: 'unknown' });

      failed.push({
        key: item.key,
        fileName: item.file.name,
        kind: apiError.kind,
        message: apiError.message,
        retryable: apiError.kind !== 'unsupported',
      });
    } else {
      uploaded.push(item);
    }
  }

  onProgress?.(queue.length, queue.length, queue[queue.length - 1]);
  return { uploaded, failed };
}
