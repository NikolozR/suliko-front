/**
 * The language id for text written *to the reader* -- review explanations,
 * the document brief -- as opposed to the translation's own language.
 *
 * English (2) on /en, Georgian (1) otherwise; the convention the translate
 * requests have always used, kept in one place so the review stops being
 * sent the translation's target language, or a placeholder, instead.
 */
export function uiOutputLanguageId(): number {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/en") ? 2 : 1;
}
