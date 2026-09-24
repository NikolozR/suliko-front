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
 * 5 = Gemini 3.8 Flash.
 *
 * 3.8 Flash was measured against 2.5 Pro on a six-page document and returned the
 * full translation in 47s rather than 86s, where 2.5 Pro abbreviated it. Do not
 * send 3 unless it has been checked recently: it pointed at a model Google
 * retired, and such ids are withdrawn on Google's schedule, not ours.
 */
export const TRANSLATION_MODEL = 5;
