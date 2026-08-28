/**
 * Conversion tracking — handoff §11.
 *
 * One event shape. Every CTA pushes a single `cta_click` to `dataLayer`;
 * what counts as a conversion is decided downstream (GTM, or the Metrika goal
 * map below), not in component code. Add a channel here, not a new event.
 *
 * Firing discipline is the part that matters:
 *  - `order_start`  fires when the order tab is opened — intent, not a lead.
 *  - `order_submit` fires ONLY after the order is accepted, never on the button
 *    press. Firing on the press counts validation bounces and server errors as
 *    leads, which is how Ads and the inbox end up disagreeing.
 *  - `calculator`   fires after the quote is produced, not at the top of the
 *    submit handler.
 *  - `callback`     is its own channel so callback requests can be weighted
 *    separately from document orders.
 */

export type CtaChannel =
  | 'whatsapp'
  | 'phone'
  | 'telegram'
  | 'email'
  | 'callback'
  | 'order_start'
  | 'order_submit'
  | 'calculator';

export type CtaPlacement =
  | 'header'
  | 'hero'
  | 'mobile_hero'
  | 'mobile_menu'
  | 'mobile_banner'
  | 'mobile_quote'
  | 'sticky_bar'
  | 'floating'
  | 'calculator'
  | 'tab'
  | 'submit'
  | 'popup'
  | 'wizard'
  | 'footer'
  | 'thank_you'
  | 'trust_strip';

type Extra = Record<string, string | number | boolean | null>;

/** Yandex Metrika counters already initialised in the locale layout. */
const YM_COUNTERS = [104728476, 105466504];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    ym?: (counter: number, action: string, ...args: unknown[]) => void;
    hj?: (action: string, ...args: unknown[]) => void;
  }
}

/**
 * Layout truth, not user-agent guessing — the mobile hero and the sticky bar
 * are driven by the same breakpoint.
 */
function deviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  try {
    return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
  } catch {
    return 'desktop';
  }
}

function pageLanguage(): string {
  if (typeof document === 'undefined') return '';
  return document.documentElement.lang || '';
}

function pagePath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/**
 * Created immediately so events fired before a tag manager arrives queue up and
 * replay rather than being dropped.
 */
function dataLayer(): Record<string, unknown>[] {
  if (typeof window === 'undefined') return [];
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

/** Metrika goal names, one per channel. */
const YM_GOALS: Record<CtaChannel, string> = {
  whatsapp: 'notary_whatsapp',
  phone: 'notary_phone',
  telegram: 'notary_telegram',
  email: 'notary_email',
  callback: 'notary_callback',
  order_start: 'notary_order_start',
  order_submit: 'notary_order_submit',
  calculator: 'notary_calculator',
};

export function trackCta(
  channel: CtaChannel,
  placement: CtaPlacement,
  extra: Extra = {}
): void {
  if (typeof window === 'undefined') return;

  const payload = {
    event: 'cta_click',
    cta_channel: channel,
    cta_placement: placement,
    cta_id: `${channel}_${placement}`,
    device_type: deviceType(),
    page_language: pageLanguage(),
    page_path: pagePath(),
    ...extra,
  };

  try {
    dataLayer().push(payload);
  } catch {
    /* analytics must never break a CTA */
  }

  try {
    YM_COUNTERS.forEach((counter) => window.ym?.(counter, 'reachGoal', YM_GOALS[channel], extra));
  } catch {
    /* same */
  }
}

/** Hotjar tags: calculator_view, price_calculated, order_configured, order_placed… */
export function triggerHotjarEvent(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.hj?.('event', name);
  } catch {
    /* Hotjar may be blocked */
  }
}

/** Meta Pixel custom events — CalculatePrice, CopyContact, and friends. */
export function trackPixelEvent(name: string, params?: Extra): void {
  if (typeof window === 'undefined') return;
  try {
    (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq?.(
      'trackCustom',
      name,
      params
    );
  } catch {
    /* ad blockers */
  }
}

/**
 * Distinguishes a real user click from the hero's synthetic one.
 *
 * The hero scrolls to the panel and then programmatically clicks the order tab;
 * without this check the hero journey double-counts `order_start`.
 */
export function isRealClick(event: { isTrusted?: boolean } | undefined): boolean {
  return Boolean(event?.isTrusted);
}
