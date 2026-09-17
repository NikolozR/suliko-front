/**
 * Client-side Meta Pixel event helpers.
 *
 * This module deliberately does NOT initialise the pixel. Initialisation happens
 * once, in the locale layout, behind the guard in `analyticsEnv.ts`; that snippet
 * loads earliest and is the only thing that defines `fbq`. A second init path
 * used to exist here and would have double-counted every page view.
 *
 * When `fbq` is absent — on a developer machine, a preview deployment, a
 * non-allowlisted host, or behind an ad blocker — these helpers do nothing. They
 * must never install a stand-in: a previous version defined a console.log shim,
 * which permanently shadowed the real fbq if it ran first, silently swallowing
 * every event while looking healthy in the console.
 *
 * Nothing here may carry personal data. Meta's custom-data fields are for
 * non-identifying event context; identifiers belong in advanced matching as
 * SHA-256 hashes, or server-side via the Conversions API.
 */

declare global {
  interface Window {
    /** Defined only by the layout's pixel snippet, so treat it as optional. */
    fbq?: (...args: unknown[]) => void
  }
}

/** True only once the real pixel snippet has run and defined fbq. */
function isPixelReady(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

/** Fired when a visitor switches the auth form into registration mode. */
export function trackRegistrationStart(): void {
  if (!isPixelReady()) return

  window.fbq?.('track', 'InitiateCheckout', {
    content_name: 'Registration Form Started',
    content_category: 'User Signup',
  })
}

/**
 * Fired once a registration actually completes.
 *
 * This is a CompleteRegistration, not a Purchase. It used to send Purchase with
 * value: 0 for a free signup, which polluted value-based optimisation and ROAS
 * reporting and made the account's purchase data untrustworthy.
 *
 * Takes no arguments on purpose: the caller used to pass the new user's phone
 * number and name, which were spread unhashed into the custom-data payload.
 */
export function trackRegistrationComplete(): void {
  if (!isPixelReady()) return

  window.fbq?.('track', 'CompleteRegistration', {
    content_name: 'User Registration',
    content_category: 'User Signup',
  })
}

/**
 * Facebook Click ID (fbc), from the fbclid query parameter or the _fbc cookie.
 *
 * This is Meta's own attribution identifier rather than anything about the user,
 * so it is safe to forward as-is. Used to improve Conversions API matching.
 */
export function getFacebookClickId(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`

  return readCookie('_fbc')
}

/** Facebook Browser ID (fbp), set by the pixel itself in the _fbp cookie. */
export function getFacebookBrowserId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return readCookie('_fbp')
}

function readCookie(name: string): string | undefined {
  for (const cookie of document.cookie.split(';')) {
    const [cookieName, ...rest] = cookie.trim().split('=')
    if (cookieName === name) return rest.join('=') || undefined
  }
  return undefined
}
