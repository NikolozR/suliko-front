// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Report charts.
 *
 * Hand-rolled SVG rather than a charting library, for three reasons:
 *
 *   1. These render on the server. Recharts and friends are client-only, so
 *      adding one would turn the reports page into a client bundle that
 *      re-fetches what the server already has.
 *   2. The whole reports screen is four charts. A library is ~100 kB to draw
 *      bars and a donut.
 *   3. Colours come from the hue palette (`--hue-*-ink`) and therefore
 *      follow the theme for free. Most libraries want hex values passed in,
 *      which breaks dark mode.
 *
 * What each colour means is the same as on the rest of the screens: revenue
 * blue and profit green in every chart, a cost in its module's hue
 * (translators violet, notaries plum), a client type in its pill's.
 *
 * Geometry is computed in JS numbers via `toChartNumber`. That is a deliberate
 * loss of precision and it is confined to pixels — every *label* is formatted
 * from the original decimal string.
 */

import { useLocale, useTranslations } from "next-intl";

import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { formatMoneyString, formatPercent, toChartNumber } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";

/** A hue's ink as an SVG stroke. Literal class names, so Tailwind keeps them. */
const HUE_STROKE: Record<Hue, string> = {
  blue: "stroke-hue-blue-ink",
  teal: "stroke-hue-teal-ink",
  violet: "stroke-hue-violet-ink",
  plum: "stroke-hue-plum-ink",
  amber: "stroke-hue-amber-ink",
  yellow: "stroke-hue-yellow-ink",
  green: "stroke-hue-green-ink",
  red: "stroke-hue-red-ink",
  grey: "stroke-hue-grey-ink",
};

/** The two series every chart here shares. */
const REVENUE = { bg: "bg-hue-blue-ink", fill: "fill-hue-blue-ink" };
const PROFIT = {
  bg: "bg-hue-green-ink",
  fill: "fill-hue-green-ink",
  stroke: "stroke-hue-green-ink",
};

// ── Shared scaffolding ──────────────────────────────────────────────────────

/** Round to 1/2/5 × 10ⁿ so the axis labels are numbers a human would pick. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * A round gridline step for `span` split about `parts` ways: 1, 2 or 5 times
 * a power of ten. Splitting a nice maximum into fixed quarters gave ticks of
 * 0, 13, 25, 38 (audit F27); stepping by a round number gives 0, 10, 20, 30, 40.
 */
function niceStep(span: number, parts = 4): number {
  const raw = Math.max(span, 1) / parts;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Compact axis label: 12500 -> "12.5k". Axes, never amounts. */
function axisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}k`;
  return String(Math.round(value));
}

/** `2026-09` -> `Sep` (or `სექ`), plus the year when it is the first month of one. */
function monthLabel(month: string, locale: string): { label: string; year: string | null } {
  const [year, m] = month.split("-");
  const index = Number(m) - 1;
  const label =
    Number.isInteger(index) && index >= 0 && index < 12
      ? new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
          new Date(Date.UTC(Number(year), index, 1)),
        )
      : month;
  return { label, year: index === 0 ? year : null };
}

function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <ul className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-[3px]", item.className)} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground py-12 text-center text-sm">{message}</p>
  );
}

// ── Monthly trend ───────────────────────────────────────────────────────────

export interface TrendPoint {
  month: string;
  revenue: string;
  profit: string;
  orders: number;
}

/**
 * Revenue bars with a profit line over them.
 *
 * Profit shares the revenue axis on purpose: the gap between the line and the
 * top of each bar *is* the cost, which is the thing worth seeing. A second
 * axis would make a 5% margin and a 50% margin look the same.
 */
export function MonthlyTrendChart({ points }: { points: TrendPoint[] }) {
  const t = useTranslations("reports.charts");
  const locale = useLocale();
  if (points.length === 0) return <ChartEmpty message={t("empty")} />;

  // A fixed viewBox scaled by CSS: the chart is responsive without measuring
  // anything in the browser, which is what keeps this a Server Component.
  const width = 760;
  const height = 260;
  const padding = { top: 16, right: 12, bottom: 34, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const revenues = points.map((p) => toChartNumber(p.revenue));
  const profits = points.map((p) => toChartNumber(p.profit));
  const top = Math.max(...revenues, ...profits, 0);
  // Profit can be negative (a month whose expenses outran its invoices), and
  // clipping that to zero would hide exactly the month someone is looking for.
  const bottom = Math.min(0, ...profits);
  const step = niceStep(top - bottom);
  const max = Math.max(step, Math.ceil(top / step) * step);
  const floor = Math.floor(bottom / step) * step;
  const span = max - floor || 1;

  const y = (value: number) => padding.top + plotHeight - ((value - floor) / span) * plotHeight;
  // A slot never wider than 120: one or two months used to stretch across
  // the whole width, a lone bar adrift in an empty plot. Centred instead.
  const slot = Math.min(120, plotWidth / points.length);
  const offset = (plotWidth - slot * points.length) / 2;
  const barWidth = Math.min(38, slot * 0.55);
  const centre = (index: number) => padding.left + offset + slot * index + slot / 2;

  const ticks = Array.from(
    { length: Math.round(span / step) + 1 },
    (_, index) => floor + step * index,
  );
  const line = points
    .map((_, index) => `${centre(index).toFixed(1)},${y(profits[index]).toFixed(1)}`)
    .join(" ");

  return (
    <div className="space-y-3">
      <Legend
        items={[
          { label: t("revenue"), className: REVENUE.bg },
          { label: t("profit"), className: PROFIT.bg },
        ]}
      />
      {/* The viewBox is scaled to the box it is in, so on a 330px phone its
          labels came out at about 4px. It keeps its natural width instead and
          the box scrolls sideways; the newest months are the ones at the right,
          so the scroll starts there (right-to-left box, left-to-right chart). */}
      <div className="overflow-x-auto [direction:rtl]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full min-w-[760px] [direction:ltr]"
        role="img"
        aria-label={t("trendAria", { count: points.length })}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-border"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : "3 3"}
            />
            <text
              x={padding.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-xs tabular-nums"
            >
              {axisLabel(tick)}
            </text>
          </g>
        ))}

        {points.map((point, index) => {
          const value = revenues[index];
          const top = y(Math.max(value, 0));
          const base = y(0);
          const { label, year } = monthLabel(point.month, locale);
          return (
            <g key={point.month}>
              <rect
                x={centre(index) - barWidth / 2}
                y={Math.min(top, base)}
                width={barWidth}
                height={Math.max(Math.abs(base - top), 1)}
                rx={3}
                className={REVENUE.fill}
              >
                <title>
                  {t("barTitle", {
                    month: point.month,
                    revenue: formatMoneyString(point.revenue),
                    profit: formatMoneyString(point.profit),
                    count: point.orders,
                  })}
                </title>
              </rect>
              <text
                x={centre(index)}
                y={height - 21}
                textAnchor="middle"
                className="fill-muted-foreground text-xs"
              >
                {label}
              </text>
              {year && (
                <text
                  x={centre(index)}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground/70 text-xs"
                >
                  {year}
                </text>
              )}
            </g>
          );
        })}

        <polyline
          points={line}
          fill="none"
          className={PROFIT.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, index) => (
          <circle
            key={point.month}
            cx={centre(index)}
            cy={y(profits[index])}
            r={3}
            className={PROFIT.fill}
          />
        ))}
      </svg>
      </div>
    </div>
  );
}

// ── Cost breakdown ──────────────────────────────────────────────────────────

export interface CostSlice {
  label: string;
  value: string;
  /** The slice's colour: its arc and its square in the legend. */
  hue: Hue;
}

/**
 * Donut of where the money went.
 *
 * Drawn with `stroke-dasharray` on concentric arcs rather than path `A`
 * commands — same result, and no arc-flag arithmetic to get wrong.
 */
export function CostDonut({ slices }: { slices: CostSlice[] }) {
  const t = useTranslations("reports.charts");
  const values = slices.map((slice) => Math.max(toChartNumber(slice.value), 0));
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) return <ChartEmpty message={t("noCosts")} />;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="size-40 shrink-0 -rotate-90" role="img"
        aria-label={t("costAria")}>
        <circle cx={80} cy={80} r={radius} fill="none" strokeWidth={22} className="stroke-muted" />
        {slices.map((slice, index) => {
          const fraction = values[index] / total;
          const dash = fraction * circumference;
          const element = (
            <circle
              key={slice.label}
              cx={80}
              cy={80}
              r={radius}
              fill="none"
              strokeWidth={22}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              className={HUE_STROKE[slice.hue]}
            >
              <title>{`${slice.label}: ${formatMoneyString(slice.value)}`}</title>
            </circle>
          );
          offset += dash;
          return element;
        })}
      </svg>

      <ul className="min-w-48 flex-1 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span
                className={cn("size-2.5 rounded-[3px]", HUE_CLASSES[slice.hue].dot)}
                aria-hidden
              />
              <span className="text-muted-foreground">{slice.label}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="font-medium tabular-nums">{formatMoneyString(slice.value)}</span>
              <span className="text-muted-foreground ml-2 text-xs tabular-nums">
                {formatPercent(values[index] / total)}
              </span>
            </span>
          </li>
        ))}
        <li className="border-border flex items-baseline justify-between gap-3 border-t pt-2 text-sm">
          <span className="font-medium">{t("totalCost")}</span>
          <span className="font-semibold tabular-nums">
            {formatMoneyString(total.toFixed(2))}
          </span>
        </li>
      </ul>
    </div>
  );
}

// ── Horizontal comparison bars ──────────────────────────────────────────────

export interface CompareRow {
  label: string;
  /** A dot before the label, in the segment's own colour. */
  hue?: Hue;
  revenue: string;
  profit: string;
  orders: number;
}

/** Revenue vs profit per segment, as paired horizontal bars. */
export function ComparisonBars({ rows }: { rows: CompareRow[] }) {
  const t = useTranslations("reports.charts");
  if (rows.length === 0) return <ChartEmpty message={t("empty")} />;

  const max = niceCeiling(
    Math.max(...rows.flatMap((row) => [toChartNumber(row.revenue), toChartNumber(row.profit)]), 0),
  );
  const width = (value: string) => `${Math.max((toChartNumber(value) / max) * 100, 0.5)}%`;

  return (
    <div className="space-y-5">
      <Legend
        items={[
          { label: t("revenue"), className: REVENUE.bg },
          { label: t("profit"), className: PROFIT.bg },
        ]}
      />
      {rows.map((row) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {row.hue && (
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-full", HUE_CLASSES[row.hue].dot)}
                />
              )}
              {row.label}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {t("orders", { count: row.orders })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn("h-full rounded-full", REVENUE.bg)}
                style={{ width: width(row.revenue) }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs tabular-nums">
              {formatMoneyString(row.revenue)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn("h-full rounded-full", PROFIT.bg)}
                style={{ width: width(row.profit) }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs tabular-nums">
              {formatMoneyString(row.profit)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
