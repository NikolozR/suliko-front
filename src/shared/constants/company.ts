/**
 * The registered entity that collects payments, and how to reach it.
 *
 * Card processors require this to be identifiable and reachable on the site, so it
 * is shown wherever a payment can start — the landing footer, the /price page and
 * the pay-as-you-go checkout — and on the legal pages, on both suliko.ge and
 * suliko.io (one entity serves both domains).
 *
 * These are the single source of truth: the legal documents in messages/*.json
 * interpolate them rather than spelling them out, so the name and code cannot
 * drift between pages.
 */

/** Registered name, kept verbatim: providers match against the registry entry. */
export const COMPANY_NAME_KA = 'შპს სულიკო სოლუშენს'

/** Reading of the same name for the locales that do not use Georgian script. */
export const COMPANY_NAME_EN = 'Suliko Solutions LLC'

/**
 * Georgian taxpayer identification number (საიდენთიფიკაციო კოდი).
 * Matches the Client INN registered with the Bank of Georgia merchant account.
 */
export const COMPANY_ID = '445786490'

/** Support and billing address. */
export const COMPANY_EMAIL = 'info@suliko.ge'

/** Dialable form, for tel: links. */
export const COMPANY_PHONE = '+995591729911'

/** Display form, spaced for reading. */
export const COMPANY_PHONE_DISPLAY = '+995 591 729 911'

/**
 * Registered address, Georgian.
 *
 * NOTE: carried over from the previous entity on the terms page. Confirm it against
 * the Suliko Solutions registry entry before requesting the payment limit lift.
 */
export const COMPANY_ADDRESS_KA =
  'საქართველო, თბილისი, გლდანის რაიონი, მუხიანი, IVბ მიკრორაიონი, კორპუსი 37, ბინა 54'

/** The same address in Latin script. */
export const COMPANY_ADDRESS_EN =
  'Georgia, Tbilisi, Gldani District, Mukhiani, IVb Micro-district, Building 37, Apartment 54'
