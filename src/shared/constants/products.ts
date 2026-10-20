/**
 * Suliko is two products under one domain:
 *
 *  - Suliko Office (`/office`): the translation management system for bureaus.
 *    The app itself lives at office.suliko.ge; this site hosts its landing page.
 *  - Suliko Translate (`/translate`): document translation for everyone else,
 *    the editor, the notary service and the blog.
 *
 * The bare site address belongs to neither: it sends visitors on to HOME_PRODUCT.
 */
export const PRODUCTS = ["office", "translate"] as const;
export type Product = (typeof PRODUCTS)[number];

/** Where `suliko.ge`, `suliko.ge/ka` and `suliko.io/en` send a visitor. */
export const HOME_PRODUCT: Product = "office";
