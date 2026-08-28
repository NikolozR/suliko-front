/**
 * Order estimate maths — one formula, one data source.
 *
 * Every price on the page comes from the partner's `reference.php` catalogue:
 * per-page rates, document-type multipliers, urgency multipliers and handover
 * extras. Nothing is computed from a local rate card, so the calculator's quote
 * and the wizard's review can never disagree — and neither can drift from what
 * the order endpoint returns.
 *
 * Two things the catalogue deliberately does not publish:
 *  - Notarisation. The partner prices it server-side from `copy_type` and does
 *    not expose the formula, so it is never guessed at (a figure that differs
 *    from the confirmed total is worse than no figure).
 *  - Volume discounts. Their total is authoritative; a discount applied here
 *    would just be overridden.
 */

import type { OrderReference } from './notaryOrderApi';
import {
  documentTypeById,
  handoverByValue,
  pricePerPage,
  urgencyByValue,
} from './notaryReferenceData';

export interface EstimateInput {
  fromLang: string;
  toLang: string;
  documentType: number | '';
  pages: number;
  copyType: string;
}

export interface EstimateLine {
  index: number;
  pages: number;
  pricePerPage: number;
  multiplier: number;
  subtotal: number;
  notarized: boolean;
}

export interface Estimate {
  lines: EstimateLine[];
  subtotal: number;
  urgencyCharge: number;
  urgencyPercent: number;
  handoverTotal: number;
  total: number;
  /** Any notarized document means the total omits notarisation entirely. */
  hasNotarized: boolean;
  currency: string;
}

/** `price_per_page(pair) × pages × price_multiplier(document_type)` */
export function estimateLine(
  reference: OrderReference,
  doc: EstimateInput,
  index: number
): EstimateLine {
  const rate = pricePerPage(reference, doc.fromLang, doc.toLang);
  const multiplier = documentTypeById(reference, doc.documentType)?.price_multiplier ?? 1;
  const pages = Math.max(1, Math.floor(doc.pages || 1));

  return {
    index,
    pages,
    pricePerPage: rate,
    multiplier,
    subtotal: rate * pages * multiplier,
    notarized:
      reference.copy_types.find((c) => c.value === doc.copyType)?.notarized ?? false,
  };
}

/**
 * subtotal      = Σ line subtotals
 * urgencyCharge = subtotal × (urgency.multiplier − 1)
 * handoverTotal = Σ extra_cost of the selected methods
 * total         = subtotal + urgencyCharge + handoverTotal
 */
export function estimateOrder(
  reference: OrderReference,
  documents: EstimateInput[],
  urgency: string,
  handover: string[] = []
): Estimate {
  const lines = documents.map((doc, index) => estimateLine(reference, doc, index));
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);

  const urgencyMultiplier = urgencyByValue(reference, urgency)?.multiplier ?? 1;
  const urgencyCharge = subtotal * (urgencyMultiplier - 1);
  const handoverTotal = handover.reduce(
    (sum, value) => sum + (handoverByValue(reference, value)?.extra_cost ?? 0),
    0
  );

  return {
    lines,
    subtotal,
    urgencyCharge,
    urgencyPercent: Math.round((urgencyMultiplier - 1) * 100),
    handoverTotal,
    total: subtotal + urgencyCharge + handoverTotal,
    hasNotarized: lines.some((line) => line.notarized),
    currency: reference.currency,
  };
}

/**
 * The catalogue reports ISO 4217 ("GEL"); the page speaks in symbols
 * everywhere else. Display-only — the code is what travels in payloads.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  GEL: '₾',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] ?? currency ?? '';
}

export function formatMoney(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currencySymbol(currency)}`;
}

/** Cheapest published rate — the honest basis for a "from X per page" claim. */
export function lowestPricePerPage(reference: OrderReference): number {
  const prices = reference.language_pairs.map((p) => p.price_per_page).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : 0;
}
