/**
 * Notary pricing configuration — seed / fallback values.
 *
 * Shape mirrors the `settings.pricing` JSON blob described in the
 * NotaryTranslation handoff §7. Everything the calculator, the prices section
 * and the marketing copy display is derived from this one object, so a single
 * edit here moves every number on the page.
 *
 * Georgian is the hub language: pairs are seeded Georgian ↔ X in both
 * directions, and anything else is priced through Georgian (see
 * `getPairPrice` in `notaryPricing.ts`).
 */

export type LocaleCode = 'en' | 'ka' | 'pl';

export interface PricingLanguage {
  code: string;
  /** ISO 639-1 code — the vocabulary the partner Order API speaks. */
  iso: string;
  price: number;
  enabled: boolean;
  names: Record<string, string>;
}

export interface PricingPair {
  from: string;
  to: string;
  price: number;
  enabled: boolean;
}

export interface PricingDiscount {
  minPages: number;
  percent: number;
}

export interface NotaryTier {
  /** `null` marks the open-ended last tier. */
  upToPages: number | null;
  pricePerPage: number;
}

export interface NotaryConfig {
  tiers: NotaryTier[];
  vatRate: number;
  serviceFee: number;
  formSurcharge: { perDocument: number; perPage: number };
}

export interface DeliveryRow {
  upToPages: number | null;
  /** `null` ⇒ "custom, we will contact you". */
  minutes: number | null;
}

export interface PricingConfig {
  version: number;
  currency: string;
  /** The advertised "from X ₾/page" — a claim, not a lookup. */
  startingPrice: number;
  languages: PricingLanguage[];
  pairs: PricingPair[];
  discounts: PricingDiscount[];
  notary: NotaryConfig;
  delivery: DeliveryRow[];
}

const LANGUAGE_SEED: Array<{
  code: string;
  iso: string;
  price: number;
  en: string;
  ka: string;
  pl: string;
}> = [
  { code: 'georgian', iso: 'ka',    price: 15,   en: 'Georgian',    ka: 'ქართული',        pl: 'Gruziński' },
  { code: 'english', iso: 'en',     price: 22.5, en: 'English',     ka: 'ინგლისური',      pl: 'Angielski' },
  { code: 'russian', iso: 'ru',     price: 22.5, en: 'Russian',     ka: 'რუსული',         pl: 'Rosyjski' },
  { code: 'azerbaijani', iso: 'az', price: 25,   en: 'Azerbaijani', ka: 'აზერბაიჯანული',  pl: 'Azerbejdżański' },
  { code: 'turkish', iso: 'tr',     price: 25,   en: 'Turkish',     ka: 'თურქული',        pl: 'Turecki' },
  { code: 'italian', iso: 'it',     price: 30,   en: 'Italian',     ka: 'იტალიური',       pl: 'Włoski' },
  { code: 'armenian', iso: 'hy',    price: 30,   en: 'Armenian',    ka: 'სომხური',        pl: 'Ormiański' },
  { code: 'german', iso: 'de',      price: 30,   en: 'German',      ka: 'გერმანული',      pl: 'Niemiecki' },
  { code: 'french', iso: 'fr',      price: 30,   en: 'French',      ka: 'ფრანგული',       pl: 'Francuski' },
  { code: 'latvian', iso: 'lv',     price: 30,   en: 'Latvian',     ka: 'ლატვიური',       pl: 'Łotewski' },
  { code: 'slovak', iso: 'sk',      price: 30,   en: 'Slovak',      ka: 'სლოვაკური',      pl: 'Słowacki' },
  { code: 'hebrew', iso: 'he',      price: 45,   en: 'Hebrew',      ka: 'ებრაული',        pl: 'Hebrajski' },
  { code: 'arabic', iso: 'ar',      price: 50,   en: 'Arabic',      ka: 'არაბული',        pl: 'Arabski' },
  { code: 'spanish', iso: 'es',     price: 70,   en: 'Spanish',     ka: 'ესპანური',       pl: 'Hiszpański' },
  { code: 'portuguese', iso: 'pt',  price: 70,   en: 'Portuguese',  ka: 'პორტუგალიური',   pl: 'Portugalski' },
  { code: 'dutch', iso: 'nl',       price: 70,   en: 'Dutch',       ka: 'ჰოლანდიური',     pl: 'Holenderski' },
  { code: 'swedish', iso: 'sv',     price: 70,   en: 'Swedish',     ka: 'შვედური',        pl: 'Szwedzki' },
  { code: 'norwegian', iso: 'no',   price: 70,   en: 'Norwegian',   ka: 'ნორვეგიული',     pl: 'Norweski' },
  { code: 'finnish', iso: 'fi',     price: 70,   en: 'Finnish',     ka: 'ფინური',         pl: 'Fiński' },
  { code: 'chinese', iso: 'zh',     price: 100,  en: 'Chinese',     ka: 'ჩინური',         pl: 'Chiński' },
  { code: 'japanese', iso: 'ja',    price: 100,  en: 'Japanese',    ka: 'იაპონური',       pl: 'Japoński' },
  { code: 'korean', iso: 'ko',      price: 100,  en: 'Korean',      ka: 'კორეული',        pl: 'Koreański' },
];

const LANGUAGES: PricingLanguage[] = LANGUAGE_SEED.map(({ code, iso, price, en, ka, pl }) => ({
  code,
  iso,
  price,
  enabled: true,
  names: { en, ka, pl },
}));

/** Georgian ↔ every other language, both directions: 21 × 2 = 42 seeded rows. */
const HUB_PAIRS: PricingPair[] = LANGUAGE_SEED.filter((l) => l.code !== 'georgian').flatMap(
  (l) => [
    { from: 'georgian', to: l.code, price: l.price, enabled: true },
    { from: l.code, to: 'georgian', price: l.price, enabled: true },
  ]
);

export const DEFAULT_PRICING: PricingConfig = {
  version: 2,
  currency: '₾',
  startingPrice: 20,
  languages: LANGUAGES,
  pairs: HUB_PAIRS,
  discounts: [
    { minPages: 50, percent: 10 },
    { minPages: 100, percent: 15 },
  ],
  notary: {
    tiers: [
      { upToPages: 1, pricePerPage: 6 },
      { upToPages: 10, pricePerPage: 4 },
      { upToPages: 50, pricePerPage: 3 },
      { upToPages: null, pricePerPage: 2 },
    ],
    vatRate: 0.18,
    serviceFee: 5,
    formSurcharge: { perDocument: 5, perPage: 0 },
  },
  delivery: [
    { upToPages: 10, minutes: 90 },
    { upToPages: 40, minutes: 180 },
    { upToPages: null, minutes: null },
  ],
};

export default DEFAULT_PRICING;
