/**
 * The one place the translation model is chosen.
 *
 * There used to be three copies of the bare number `2` — one in
 * `documentTranslation.ts`, one in `startTranslationProject.ts`, and a
 * `DEFAULT_MODEL` in the bulk panel — each commented only as "the Gemini model".
 * Nothing tied them together, so a model migration meant finding all three, and
 * the backend's own default had already drifted away from them.
 */

/**
 * `AIModel` on the API: 2 = Gemini 2.5 Pro, 3 = Gemini 3 Pro, 4 = Gemini 3 Flash,
 * 5 = Gemini 3.8 Flash, 6 = Gemini 4 Argon, 7 = Gemini 4 Hydrogen.
 *
 * Gemini 4 Argon since 2026-11-23. In a blind-judged comparison of six model
 * settings on four documents (Georgian <-> English) it scored 9.56/10 against
 * 9.0 for 3.8 Flash, and was about 1.4x faster per page. The API must know 6
 * before this ships: form-posted requests (subtitles) reject an enum value the
 * API does not define. Do not send 3 unless it has been checked recently:
 * it pointed at a model Google retired, and such ids are withdrawn on Google's
 * schedule, not ours.
 */
export const TRANSLATION_MODEL = 6;
