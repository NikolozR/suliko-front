/**
 * Order option catalogue — handoff §3.3.
 *
 * Nothing about languages, document types or rates is hardcoded in the wizard;
 * it all comes from `GET /reference`.
 *
 * Caching deliberately differs from the source handoff, which cached 6 h in the
 * browser via `sessionStorage`. The proxy's own 1 h server-side cache already
 * caps what the partner sees at ~24 calls a day regardless of traffic, so the
 * browser layer bought nothing and cost real staleness: a pair added in the
 * partner's admin stayed invisible here for up to six hours. Now only an
 * in-memory cache remains, so a reload always re-checks.
 *
 * Deviation from the source handoff, deliberate: when the partner catalogue is
 * unreachable — which is the case until `NOTARY_ORDER_API_KEY` is set — the
 * wizard falls back to a catalogue derived from the local pricing config
 * instead of rendering a dead panel. `isFallback` on the result says which one
 * you got, and the wizard routes those orders to the email path.
 */

import {
  fetchReference,
  type OrderReference,
  type ReferenceCopyType,
  type ReferenceDocumentType,
  type ReferenceHandoverMethod,
  type ReferenceLanguage,
  type ReferenceLanguagePair,
  type ReferenceUrgencyLevel,
} from './notaryOrderApi';
import { LEGACY_REFERENCE_CACHE_KEY, REFERENCE_MEMORY_TTL_MS } from './notaryOrderConfig';
import { DEFAULT_PRICING, getPairPrice, type PricingConfig } from './notaryPricing';

export interface ReferenceResult {
  reference: OrderReference;
  /** True when this came from the local config, not the partner. */
  isFallback: boolean;
}

interface CacheEntry {
  savedAt: number;
  reference: OrderReference;
}

let memoryCache: CacheEntry | null = null;
let inFlight: Promise<ReferenceResult> | null = null;

/**
 * Visitors from before the sessionStorage layer was removed still carry an
 * entry with up to 6 h left on it. Drop it so nobody stays pinned to a stale
 * catalogue. Wrapped because storage access throws in private mode (§16.8).
 */
function dropLegacySessionCache(): void {
  try {
    window.sessionStorage.removeItem(LEGACY_REFERENCE_CACHE_KEY);
  } catch {
    /* nothing to do */
  }
}

const isFresh = (entry: CacheEntry | null): entry is CacheEntry =>
  Boolean(entry) && Date.now() - (entry as CacheEntry).savedAt < REFERENCE_MEMORY_TTL_MS;

// ---------------------------------------------------------------------------
// Local catalogue
// ---------------------------------------------------------------------------

/**
 * A subset of the partner's real catalogue, with their real `type_id` values —
 * invented ids would 422 the moment the partner came back up mid-session.
 */
export const FALLBACK_DOCUMENT_TYPES: ReferenceDocumentType[] = [
  { type_id: 1, type_name: 'Passport', price_multiplier: 1 },
  { type_id: 2, type_name: 'Birth Certificate', price_multiplier: 1 },
  { type_id: 3, type_name: 'Death Certificate', price_multiplier: 1 },
  { type_id: 4, type_name: 'Medical Certificate', price_multiplier: 1.3 },
  { type_id: 5, type_name: 'Academic Transcript', price_multiplier: 1 },
  { type_id: 6, type_name: 'Criminal Record', price_multiplier: 1 },
  { type_id: 8, type_name: 'Contract', price_multiplier: 1 },
  { type_id: 10, type_name: 'Power of Attorney', price_multiplier: 1.2 },
  { type_id: 11, type_name: 'Marriage Certificate', price_multiplier: 1 },
  { type_id: 12, type_name: 'Diploma', price_multiplier: 1 },
  { type_id: 14, type_name: 'Certificate', price_multiplier: 1 },
  { type_id: 21, type_name: "Driver's license", price_multiplier: 1 },
  { type_id: 17, type_name: 'other', price_multiplier: 1 },
];

/**
 * `serviceType` in the wizard is a UI split of this single list: `regular`
 * shows the rows where `notarized === false`, `notary` shows the rest.
 */
export const FALLBACK_COPY_TYPES: ReferenceCopyType[] = [
  { value: 'original', label: 'Original Document', notarized: false },
  { value: 'plain', label: 'Photocopy', notarized: false },
  { value: 'notary_original', label: 'Notary on Original', notarized: true },
  { value: 'notary_copy', label: 'Notary on Copy', notarized: true },
  { value: 'notary_certified', label: 'Certified Copy (Notarized)', notarized: true },
];

export const FALLBACK_URGENCY_LEVELS: ReferenceUrgencyLevel[] = [
  { value: 'standard', label: 'Standard (3-5 business days)', multiplier: 1 },
  { value: 'express', label: 'Express (1-2 business days)', multiplier: 1.5 },
  { value: 'urgent', label: 'Urgent (same day)', multiplier: 2 },
];

export const FALLBACK_HANDOVER_METHODS: ReferenceHandoverMethod[] = [
  { value: 'scan', label: 'Scan (sent via email)', extra_cost: 0, requires_address: false },
  { value: 'pickup', label: 'Pick up from our office', extra_cost: 0, requires_address: false },
  { value: 'delivery', label: 'Courier delivery to address', extra_cost: 10, requires_address: true },
];

/**
 * Build the catalogue from the pricing config. Every enabled language becomes
 * a `language`, and every enabled language is pairable with every other one at
 * the hub-routed rate — the same arithmetic the calculator quotes.
 */
export function buildLocalReference(
  config: PricingConfig = DEFAULT_PRICING
): OrderReference {
  const enabled = config.languages.filter((l) => l.enabled);

  // ISO codes, not our internal long names: `en-ka` is what the partner's
  // `language_pair` field expects, and a payload built while the catalogue was
  // unreachable still has to be valid if it is ever replayed.
  const languages: ReferenceLanguage[] = enabled.map((l) => ({
    language_code: l.iso,
    language_name: l.names.en ?? l.code,
    language_name_georgian: l.names.ka,
  }));

  const language_pairs: ReferenceLanguagePair[] = [];
  enabled.forEach((from) => {
    enabled.forEach((to) => {
      if (from.code === to.code) return;
      language_pairs.push({
        language_pair: `${from.iso}-${to.iso}`,
        source_language: from.iso,
        target_language: to.iso,
        price_per_page: getPairPrice(config, from.code, to.code),
      });
    });
  });

  return {
    currency: config.currency,
    languages,
    language_pairs,
    document_types: FALLBACK_DOCUMENT_TYPES,
    copy_types: FALLBACK_COPY_TYPES,
    urgency_levels: FALLBACK_URGENCY_LEVELS,
    handover_methods: FALLBACK_HANDOVER_METHODS,
  };
}

/** A catalogue missing its core lists is unusable even if the call succeeded. */
function isUsable(reference: OrderReference | null): reference is OrderReference {
  return Boolean(
    reference &&
      reference.languages?.length &&
      reference.language_pairs?.length &&
      reference.copy_types?.length
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load the catalogue: in-memory → network → local fallback. Concurrent callers
 * share one in-flight request.
 */
export function loadReference(config?: PricingConfig): Promise<ReferenceResult> {
  if (typeof window !== 'undefined') dropLegacySessionCache();

  if (isFresh(memoryCache)) {
    return Promise.resolve({ reference: memoryCache.reference, isFallback: false });
  }

  if (inFlight) return inFlight;

  inFlight = fetchReference()
    .then((reference) => {
      if (!isUsable(reference)) throw new Error('Incomplete reference payload.');
      memoryCache = { savedAt: Date.now(), reference };
      return { reference, isFallback: false };
    })
    .catch(() => ({ reference: buildLocalReference(config), isFallback: true }))
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Clears the in-memory copy; the next `loadReference` re-fetches. */
export function clearReferenceCache(): void {
  memoryCache = null;
  if (typeof window !== 'undefined') dropLegacySessionCache();
}

// ---------------------------------------------------------------------------
// Lookups the wizard needs
// ---------------------------------------------------------------------------

/**
 * Only the languages that actually appear as a source in a published pair.
 *
 * The catalogue lists far more languages than it publishes pairs for (46 vs 12
 * at the time of writing), and offering one with no targets is a dead end the
 * visitor only discovers after choosing it.
 */
export function sourcesFor(reference: OrderReference): ReferenceLanguage[] {
  const codes = new Set(reference.language_pairs.map((p) => p.source_language));
  return reference.languages.filter((l) => codes.has(l.language_code));
}

export function targetsFor(reference: OrderReference, from: string): ReferenceLanguage[] {
  const codes = new Set(
    reference.language_pairs
      .filter((p) => p.source_language === from)
      .map((p) => p.target_language)
  );
  return reference.languages.filter((l) => codes.has(l.language_code));
}

export function pairExists(reference: OrderReference, from: string, to: string): boolean {
  return reference.language_pairs.some(
    (p) => p.source_language === from && p.target_language === to
  );
}

export function pricePerPage(reference: OrderReference, from: string, to: string): number {
  return (
    reference.language_pairs.find(
      (p) => p.source_language === from && p.target_language === to
    )?.price_per_page ?? 0
  );
}

export function documentTypeById(
  reference: OrderReference,
  typeId: number | ''
): ReferenceDocumentType | undefined {
  if (typeId === '') return undefined;
  return reference.document_types.find((d) => d.type_id === typeId);
}

export function copyTypesFor(
  reference: OrderReference,
  serviceType: 'regular' | 'notary'
): ReferenceCopyType[] {
  return reference.copy_types.filter((c) => c.notarized === (serviceType === 'notary'));
}

export function urgencyByValue(
  reference: OrderReference,
  value: string
): ReferenceUrgencyLevel | undefined {
  return reference.urgency_levels.find((u) => u.value === value);
}

export function handoverByValue(
  reference: OrderReference,
  value: string
): ReferenceHandoverMethod | undefined {
  return reference.handover_methods.find((h) => h.value === value);
}

/** Any selected method that needs a postal address makes the field required. */
export function handoverRequiresAddress(
  reference: OrderReference,
  selected: string[]
): boolean {
  return selected.some((value) => handoverByValue(reference, value)?.requires_address);
}

/** Prefer the Georgian display name on the Georgian locale, per the payload shape. */
export function displayLanguageName(
  language: ReferenceLanguage | undefined,
  locale: string
): string {
  if (!language) return '';
  if (locale === 'ka' && language.language_name_georgian) {
    return language.language_name_georgian;
  }
  return language.language_name;
}
