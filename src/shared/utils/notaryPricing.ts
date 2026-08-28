/**
 * Notary pricing maths — pure functions, config as the first argument.
 *
 * Implements handoff §6.1 (hub-language routing) and §7 (config normalisation).
 * The calculator, the prices section and the marketing copy all run the exact
 * same arithmetic through here, so a quote and a published rate can never
 * disagree.
 */

import {
  DEFAULT_PRICING,
  type DeliveryRow,
  type NotaryConfig,
  type NotaryTier,
  type PricingConfig,
  type PricingDiscount,
  type PricingLanguage,
  type PricingPair,
} from '@/shared/config/notaryPricingDefaults';

export const HUB_LANGUAGE = 'georgian';

/**
 * The notary form the client needs. These are the same `copy_type` codes the
 * order wizard sends to the partner API, so a quote and an order describe the
 * same service.
 */
export type NotaryForm = 'notary_original' | 'notary_copy' | 'notary_certified';

export const NOTARY_FORMS: readonly NotaryForm[] = [
  'notary_original',
  'notary_copy',
  'notary_certified',
] as const;

/** Notary on a plain copy pays the tiers only — no form surcharge. */
const FORMS_WITH_SURCHARGE: readonly NotaryForm[] = ['notary_original', 'notary_certified'];

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const num = (value: unknown, fallback: number): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
};

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const str = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;

/** `upToPages` may legitimately be null (the open-ended row). */
const cap = (value: unknown): number | null => {
  if (value === null) return null;
  const n = num(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
};

/**
 * Coerce whatever came back from storage field-by-field, so a partial or older
 * row degrades to defaults instead of taking the page down.
 */
export function normalizePricing(raw: unknown): PricingConfig {
  const input = (raw ?? {}) as Partial<PricingConfig>;
  const d = DEFAULT_PRICING;

  const languages: PricingLanguage[] = Array.isArray(input.languages)
    ? input.languages
        .filter((l): l is PricingLanguage => Boolean(l) && typeof l.code === 'string')
        .map((l) => ({
          code: l.code,
          // Falls back to the seeded ISO code, then to the internal code, so a
          // stored row written before `iso` existed still yields a usable pair.
          iso: str(
            l.iso,
            DEFAULT_PRICING.languages.find((d) => d.code === l.code)?.iso ?? l.code
          ),
          price: num(l.price, 0),
          enabled: bool(l.enabled, true),
          names:
            l.names && typeof l.names === 'object'
              ? (l.names as Record<string, string>)
              : { en: l.code },
        }))
    : d.languages;

  const pairs: PricingPair[] = Array.isArray(input.pairs)
    ? input.pairs
        .filter(
          (p): p is PricingPair =>
            Boolean(p) && typeof p.from === 'string' && typeof p.to === 'string'
        )
        .map((p) => ({
          from: p.from,
          to: p.to,
          price: num(p.price, 0),
          enabled: bool(p.enabled, true),
        }))
    : d.pairs;

  const discounts: PricingDiscount[] = Array.isArray(input.discounts)
    ? input.discounts
        .filter(Boolean)
        .map((x) => ({ minPages: num(x?.minPages, 0), percent: num(x?.percent, 0) }))
        .sort((a, b) => a.minPages - b.minPages)
    : d.discounts;

  const rawNotary = (input.notary ?? {}) as Partial<NotaryConfig>;
  const tiers: NotaryTier[] = Array.isArray(rawNotary.tiers) && rawNotary.tiers.length > 0
    ? rawNotary.tiers
        .filter(Boolean)
        .map((tier) => ({
          upToPages: cap(tier?.upToPages),
          pricePerPage: num(tier?.pricePerPage, 0),
        }))
    : d.notary.tiers;

  const notary: NotaryConfig = {
    // Finite tiers ascending, the open-ended row last, whatever order it arrived in.
    tiers: [...tiers].sort((a, b) => {
      if (a.upToPages === null) return 1;
      if (b.upToPages === null) return -1;
      return a.upToPages - b.upToPages;
    }),
    vatRate: num(rawNotary.vatRate, d.notary.vatRate),
    serviceFee: num(rawNotary.serviceFee, d.notary.serviceFee),
    formSurcharge: {
      perDocument: num(rawNotary.formSurcharge?.perDocument, d.notary.formSurcharge.perDocument),
      perPage: num(rawNotary.formSurcharge?.perPage, d.notary.formSurcharge.perPage),
    },
  };

  const delivery: DeliveryRow[] = Array.isArray(input.delivery) && input.delivery.length > 0
    ? input.delivery
        .filter(Boolean)
        .map((row) => ({
          upToPages: cap(row?.upToPages),
          minutes: row?.minutes === null ? null : num(row?.minutes, 0),
        }))
        .sort((a, b) => {
          if (a.upToPages === null) return 1;
          if (b.upToPages === null) return -1;
          return a.upToPages - b.upToPages;
        })
    : d.delivery;

  return {
    version: num(input.version, d.version),
    currency: str(input.currency, d.currency),
    startingPrice: num(input.startingPrice, d.startingPrice),
    languages: languages.length > 0 ? languages : d.languages,
    pairs,
    discounts,
    notary,
    delivery,
  };
}

// ---------------------------------------------------------------------------
// Language lookups
// ---------------------------------------------------------------------------

export function enabledLanguages(config: PricingConfig): PricingLanguage[] {
  return config.languages.filter((l) => l.enabled);
}

export function languageName(
  config: PricingConfig,
  code: string,
  locale: string
): string {
  const lang = config.languages.find((l) => l.code === code);
  if (!lang) return code;
  return lang.names[locale] ?? lang.names.en ?? code;
}

export function priceForLanguage(config: PricingConfig, code: string): number {
  return config.languages.find((l) => l.code === code && l.enabled)?.price ?? 0;
}

function involvesHub(from: string, to: string): boolean {
  return from === HUB_LANGUAGE || to === HUB_LANGUAGE;
}

/**
 * Per-page rate for a pair. Georgian is the hub, so:
 *
 *  1. An explicit enabled pair row always wins.
 *  2. No row and exactly one side is Georgian → a single leg, charged at the
 *     other language's rate.
 *  3. No row and neither side is Georgian → the job routes through Georgian
 *     and costs both legs, e.g. Norwegian (70) → Hebrew (45) = 115.
 */
export function getPairPrice(config: PricingConfig, from: string, to: string): number {
  const pair = config.pairs.find((p) => p.from === from && p.to === to && p.enabled);
  if (pair) return pair.price;

  if (involvesHub(from, to)) {
    return priceForLanguage(config, from === HUB_LANGUAGE ? to : from);
  }

  return priceForLanguage(config, from) + priceForLanguage(config, to);
}

/**
 * A pair is quotable when both sides are enabled and are not the same language.
 * Unlike the order wizard — which can only offer pairs the partner publishes —
 * the calculator quotes any combination, routing through the hub if needed.
 */
export function isQuotablePair(config: PricingConfig, from: string, to: string): boolean {
  if (!from || !to || from === to) return false;
  const codes = new Set(enabledLanguages(config).map((l) => l.code));
  return codes.has(from) && codes.has(to);
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** Highest matching band wins; 0 when no band applies. */
export function discountPercentFor(config: PricingConfig, pages: number): number {
  return config.discounts.reduce(
    (best, band) => (pages >= band.minPages && band.percent > best ? band.percent : best),
    0
  );
}

/** First tier whose `upToPages` covers the page count; the null row is open-ended. */
export function notaryTierFor(config: PricingConfig, pages: number): NotaryTier {
  const tiers = config.notary.tiers;
  return (
    tiers.find((tier) => tier.upToPages === null || pages <= tier.upToPages) ??
    tiers[tiers.length - 1]
  );
}

/**
 * Notary cost for one document.
 *
 * VAT applies to the tier amount only — the service fee and the form surcharge
 * sit outside it. The surcharge is charged for `notary_original` and
 * `notary_certified`; notary on a plain copy pays the tiers only.
 */
export function notaryCost(
  config: PricingConfig,
  pages: number,
  form: NotaryForm
): number {
  const { vatRate, serviceFee, formSurcharge } = config.notary;
  const tier = notaryTierFor(config, pages);
  const tierAmount = tier.pricePerPage * pages * (1 + vatRate);
  const surcharge = FORMS_WITH_SURCHARGE.includes(form)
    ? formSurcharge.perDocument + formSurcharge.perPage * pages
    : 0;
  return tierAmount + serviceFee + surcharge;
}

export interface DocumentInput {
  from: string;
  to: string;
  pages: number;
  notary: boolean;
  notaryForm: NotaryForm;
}

export interface DocumentBreakdown {
  pages: number;
  basePrice: number;
  translation: number;
  discountPercent: number;
  discount: number;
  notary: number;
  total: number;
}

/**
 * documentTotal = (translation − discount) + notary
 *
 * The discount band is chosen from this document's own page count, matching the
 * per-document line the results modal renders.
 */
export function calculateDocument(
  config: PricingConfig,
  doc: DocumentInput
): DocumentBreakdown {
  const pages = Math.max(1, Math.floor(doc.pages || 1));
  const basePrice = getPairPrice(config, doc.from, doc.to);
  const translation = basePrice * pages;
  const discountPercent = discountPercentFor(config, pages);
  const discount = translation * (discountPercent / 100);
  const notary = doc.notary ? notaryCost(config, pages, doc.notaryForm) : 0;

  return {
    pages,
    basePrice,
    translation,
    discountPercent,
    discount,
    notary,
    total: translation - discount + notary,
  };
}

export interface OrderBreakdown {
  documents: DocumentBreakdown[];
  totalPages: number;
  translation: number;
  discount: number;
  notary: number;
  total: number;
  /** `null` ⇒ custom, we will contact you. */
  deliveryMinutes: number | null;
}

export function calculateOrder(
  config: PricingConfig,
  docs: DocumentInput[]
): OrderBreakdown {
  const documents = docs.map((doc) => calculateDocument(config, doc));
  const totalPages = documents.reduce((sum, d) => sum + d.pages, 0);

  return {
    documents,
    totalPages,
    translation: documents.reduce((sum, d) => sum + d.translation, 0),
    discount: documents.reduce((sum, d) => sum + d.discount, 0),
    notary: documents.reduce((sum, d) => sum + d.notary, 0),
    total: documents.reduce((sum, d) => sum + d.total, 0),
    deliveryMinutes: deliveryMinutesFor(config, totalPages),
  };
}

/** First delivery row whose `upToPages` covers the total; null ⇒ custom. */
export function deliveryMinutesFor(config: PricingConfig, totalPages: number): number | null {
  const row =
    config.delivery.find((r) => r.upToPages === null || totalPages <= r.upToPages) ??
    config.delivery[config.delivery.length - 1];
  return row?.minutes ?? null;
}

export function formatMoney(config: PricingConfig, amount: number): string {
  return `${amount.toFixed(2)} ${config.currency}`;
}

// ---------------------------------------------------------------------------
// Marketing copy
// ---------------------------------------------------------------------------

/**
 * Substitute pricing tokens into translated strings, so hero copy and FAQ
 * answers track the config instead of drifting from it.
 *
 * Supported: [startingPrice] [currency] [notaryMin] [notaryMax] [languageCount]
 *
 * Square brackets, not the handoff's braces: these strings pass through
 * next-intl's ICU parser first, and `{startingPrice}` there is an ICU argument
 * with no value — which throws before this function ever sees the text.
 */
export function fillPricingTokens(text: string, config: PricingConfig): string {
  const rates = config.notary.tiers.map((t) => t.pricePerPage);
  const tokens: Record<string, string | number> = {
    startingPrice: config.startingPrice,
    currency: config.currency,
    notaryMin: rates.length ? Math.min(...rates) : 0,
    notaryMax: rates.length ? Math.max(...rates) : 0,
    languageCount: enabledLanguages(config).length,
  };

  return text.replace(/\[(\w+)\]/g, (match, key: string) =>
    key in tokens ? String(tokens[key]) : match
  );
}

export { DEFAULT_PRICING };
export type {
  PricingConfig,
  PricingLanguage,
  PricingPair,
  PricingDiscount,
  NotaryConfig,
  NotaryTier,
  DeliveryRow,
};
