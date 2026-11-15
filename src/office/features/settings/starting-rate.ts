// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The rate a new language pair starts at when the person leaves the box empty.
 * It is the same number the API quotes an unpriced pair at
 * (`FALLBACK_RATE_PER_PAGE` in `domain/pricing.py`), so the first quote does not
 * change when the pair is saved. A text, as the pair-price form takes it.
 */
export const STARTING_RATE = "15";