/**
 * The single gate that decides whether Meta Pixel code is allowed to run.
 *
 * The pixel feeds custom audiences and conversion optimisation that live ad spend
 * is bid against, so anything that is not real customer traffic has to stay out of
 * it. Preview deployments and developer machines were previously writing into the
 * production pixel, which teaches Meta to go looking for people who resemble our
 * own developers.
 *
 * The guard has two halves that are deliberately evaluated in different places,
 * because neither one is knowable in both:
 *
 *   - `isProductionDeployment()` reads `VERCEL_ENV`, which only exists on the
 *     server. It is checked while the layout renders, and decides whether the
 *     pixel snippet is emitted into the HTML at all.
 *   - `isAllowedAnalyticsHost()` reads the hostname, which only exists in the
 *     browser. It is checked inside the emitted snippet, before `fbq` is defined.
 *
 * They are never both evaluated in the same environment, so neither can be
 * silently false because the other one's input was unavailable. The server half
 * cannot be moved to the client (`VERCEL_ENV` has no `NEXT_PUBLIC_` prefix, so it
 * is not in the client bundle, and reading it there would always yield
 * `undefined` — disabling the pixel in production, which is the failure we are
 * trying to avoid).
 */

/**
 * Hosts that represent real, customer-facing traffic.
 *
 * Both domains are production: suliko.io is the English/EUR site, not stray
 * traffic — see `domainUtils.ts`, which branches on it for verification method
 * and currency. Gating to suliko.ge alone would switch off tracking on a live
 * site. Apex and www are both listed because either can serve a visitor.
 */
export const ANALYTICS_ALLOWED_HOSTS: readonly string[] = [
  'suliko.ge',
  'www.suliko.ge',
  'suliko.io',
  'www.suliko.io',
]

/**
 * Server half of the guard: true only on a Vercel production deployment.
 *
 * `VERCEL_ENV` is 'production' | 'preview' | 'development' and is unset outside
 * Vercel, so a developer's machine fails this. `NODE_ENV` is deliberately not
 * used: it is 'production' for preview builds too, which is exactly how
 * suliko-front-five.vercel.app ended up in the pixel.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production'
}

/** Client half of the guard: is this hostname one we want to track? */
export function isAllowedAnalyticsHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false
  return ANALYTICS_ALLOWED_HOSTS.includes(hostname.toLowerCase())
}

/**
 * The Meta Pixel ID, or undefined when it has not been configured.
 *
 * Read from the environment rather than hardcoded so the id lives in one place.
 * Must be referenced as a full literal `process.env.NEXT_PUBLIC_META_PIXEL_ID`
 * for Next.js to inline it into the client bundle.
 */
export function getMetaPixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || undefined
}

/**
 * Whether the server should emit Meta Pixel code at all.
 *
 * Requires a configured pixel id as well as a production deployment, so a missing
 * env var fails closed rather than rendering `fbq('init', 'undefined')`.
 */
export function isAnalyticsEnabled(): boolean {
  return isProductionDeployment() && Boolean(getMetaPixelId())
}
