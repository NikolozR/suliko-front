// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { Link } from "@office/i18n/navigation";
import { SegmentedNav, segmentedItem } from "@office/shared/components/segmented";

/**
 * Report period selector.
 *
 * Plain links, not a client component: the range lives in the URL, so a
 * report is shareable and the back button works. Nothing here needs to run
 * in the browser.
 */

export type PeriodKey = "this-month" | "last-3" | "ytd" | "last-12" | "all";

export interface Period {
  key: PeriodKey;
  /** ISO dates, or undefined for an open-ended side. */
  start?: string;
  end?: string;
  /** How many months of trend to fetch alongside. */
  months: number;
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The selectable ranges, relative to `today`.
 *
 * `today` is the bureau's calendar date (`YYYY-MM-DD`, from `todayIn` with the
 * session's timezone), not the server's clock: at 01:00 in Tbilisi a UTC
 * server is still in yesterday, and on the 1st of a month "This month" would
 * have shown the previous one.
 */
export function periods(todayIso: string): Period[] {
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7)) - 1;
  const today = new Date(Date.UTC(year, month, Number(todayIso.slice(8, 10))));

  return [
    {
      key: "this-month",
      start: iso(new Date(Date.UTC(year, month, 1))),
      end: iso(today),
      months: 6,
    },
    {
      key: "last-3",
      start: iso(new Date(Date.UTC(year, month - 2, 1))),
      end: iso(today),
      months: 6,
    },
    {
      key: "ytd",
      start: iso(new Date(Date.UTC(year, 0, 1))),
      end: iso(today),
      months: 12,
    },
    {
      key: "last-12",
      start: iso(new Date(Date.UTC(year, month - 11, 1))),
      end: iso(today),
      months: 12,
    },
    { key: "all", months: 24 },
  ];
}

export function resolvePeriod(key: string | undefined, today: string): Period {
  const all = periods(today);
  return all.find((period) => period.key === key) ?? all[3];
}

export function PeriodPicker({
  active,
  today,
  basePath = "/reports",
  query = {},
}: {
  active: PeriodKey;
  /** The bureau's today, as passed to `resolvePeriod`. */
  today: string;
  /** Route the buttons link to. Reports and Finances share this control. */
  basePath?: string;
  /** Other parameters to keep — the open Finances tab, say. */
  query?: Record<string, string>;
}) {
  const t = useTranslations("reports.period");
  const options = periods(today);
  const href = (key: string) => `${basePath}?${new URLSearchParams({ ...query, period: key })}`;

  return (
    <SegmentedNav label={t("label")}>
      {options.map((period) => {
        const selected = period.key === active;
        return (
          <Link
            key={period.key}
            href={href(period.key)}
            aria-current={selected ? "page" : undefined}
            className={segmentedItem(selected)}
          >
            {t(period.key)}
          </Link>
        );
      })}
    </SegmentedNav>
  );
}
