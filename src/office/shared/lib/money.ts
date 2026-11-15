// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Money formatting and arithmetic.
 *
 * Suliko Office is GEL-only (₾). Every amount that reaches the UI goes through
 * `formatMoney` -- there is no second way to render a currency in this app.
 *
 * ## Why amounts are handled as integer tetri internally
 *
 * The PHP app does its money arithmetic in floats, which is a latent bug:
 * IEEE-754 cannot represent 0.1 exactly, so sums of many order lines drift.
 * On the frontend we mostly *display* server-computed totals, so the risk is
 * small -- but the calculator and the order builder do compute live totals in
 * the browser, and those must agree with the server to the tetri.
 *
 * Rule: do arithmetic in `Tetri` (integer minor units), format at the edge.
 */

/** An integer number of tetri (1 GEL = 100 tetri). */
export type Tetri = number;

export const CURRENCY_CODE = "GEL";
export const CURRENCY_SYMBOL = "₾";

/** Convert a GEL amount to integer tetri, rounding half away from zero. */
export function toTetri(gel: number): Tetri {
  return Math.sign(gel) * Math.round(Math.abs(gel) * 100);
}

/** Convert integer tetri back to a GEL number. Only do this to format. */
export function fromTetri(tetri: Tetri): number {
  return tetri / 100;
}

/** Sum tetri safely. */
export function sumTetri(values: readonly Tetri[]): Tetri {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Multiply a tetri amount by a decimal factor (a price multiplier), rounding
 * half away from zero -- the same rule the invoices use.
 */
export function multiplyTetri(tetri: Tetri, factor: number): Tetri {
  const product = tetri * factor;
  return Math.sign(product) * Math.round(Math.abs(product));
}

/**
 * Digit grouping locale for money.
 *
 * Deliberately NOT the UI locale. The PHP app formats with `number_format()`,
 * which is always `1,234.56` — comma thousands, period decimal — and that is
 * what every existing invoice, act and report shows. `ka-GE` would render
 * `1 234,56`, which is correct Georgian but does not match the product.
 * Amounts read the same in both languages; only the labels translate.
 */
const MONEY_LOCALE = "en-US";

export interface FormatMoneyOptions {
  /** Override the grouping locale. You almost never want to. */
  locale?: string;
  /** Render the symbol. Default true. */
  showSymbol?: boolean;
  /** Always show a +/- sign. Useful for deltas. Default false. */
  signed?: boolean;
}

/**
 * Format a GEL amount for display: `1,234.56 ₾`.
 *
 * The symbol trails the number with a non-breaking space, matching the PHP app
 * and the production screenshots.
 */
export function formatMoney(
  gel: number | null | undefined,
  options: FormatMoneyOptions = {},
): string {
  const { locale = MONEY_LOCALE, showSymbol = true, signed = false } = options;
  const value = gel ?? 0;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);

  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
}

/** Format an integer-tetri amount for display. */
export function formatTetri(tetri: Tetri, options?: FormatMoneyOptions): string {
  return formatMoney(fromTetri(tetri), options);
}

/**
 * Format a ratio as a whole-number percentage: `0.53` -> `53%`.
 * Returns `null` for an undefined denominator so callers can omit the label
 * rather than print a misleading `0%`.
 */
export function formatPercent(ratio: number | null | undefined): string | null {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return null;
  return `${Math.round(ratio * 100)}%`;
}

/** Profit margin as a ratio, or null when there is no revenue to divide by. */
export function margin(profit: number, revenue: number): number | null {
  if (!revenue) return null;
  return profit / revenue;
}

/** Payment state of an order, driving the tri-state icon next to Price. */
export type PaidState = "unpaid" | "partial" | "paid";

/**
 * Port of the PHP's `paid_status_icon_html($due, $paid)`.
 * Compared in tetri so float dust never reports a fully-paid order as partial.
 */
export function paidState(due: number, paid: number): PaidState {
  const dueTetri = toTetri(due);
  const paidTetri = toTetri(paid);
  if (paidTetri <= 0) return "unpaid";
  if (paidTetri >= dueTetri) return "paid";
  return "partial";
}

/**
 * Format a server decimal string (`"1234.5"`) as `1,234.50 ₾` without ever
 * turning it into a float.
 *
 * The API sends money as decimal strings precisely so nothing rounds it on
 * the way to the screen; `formatMoney(Number(value))` would undo that. Use
 * this for anything that came off the wire, and `formatMoney` only for
 * amounts computed in the browser.
 */
export function formatMoneyString(
  value: string | null | undefined,
  options: { showSymbol?: boolean; dash?: string } = {},
): string {
  const { showSymbol = true, dash = "–" } = options;
  if (value === null || value === undefined || value === "") return dash;

  const [whole = "0", fraction = "00"] = value.split(".");
  const negative = whole.startsWith("-");
  const digits = (negative ? whole.slice(1) : whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = `${negative ? "-" : ""}${digits}.${fraction.padEnd(2, "0").slice(0, 2)}`;

  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
}

/**
 * A decimal string as a JS number, for chart geometry only.
 *
 * Named so that every call site reads as a deliberate loss of precision. Never
 * use the result in anything the user sees as an amount — pixels only.
 */
export function toChartNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * A decimal string (`"120.5"`, `"120,50"`, `"-3"`) as exact integer tetri,
 * without a float in between — for totals the browser has to add up itself,
 * such as an order whose prices were typed in by hand. Null when it is not a
 * money amount.
 */
export function parseTetri(value: string | null | undefined): Tetri | null {
  const text = (value ?? "").replace(/\s/g, "").replace(",", ".");
  const match = /^(-?)(\d+)(?:\.(\d{0,2})\d*)?$/.exec(text);
  if (!match) return null;
  const [, sign, whole = "0", fraction = ""] = match;
  const tetri = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -tetri : tetri;
}

/** Integer tetri as the API's decimal string: `12050` → `"120.50"`. */
export function tetriToString(tetri: Tetri): string {
  const sign = tetri < 0 ? "-" : "";
  const abs = Math.abs(tetri);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
