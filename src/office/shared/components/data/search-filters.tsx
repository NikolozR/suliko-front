"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import { usePathname, useRouter } from "@office/i18n/navigation";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { startNavigationProgress } from "@office/shared/components/shell/navigation-progress";
import { Button } from "@office/shared/components/ui/button";
import { Card } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

/**
 * Generic list filters: a search box plus zero or more dropdowns, as the
 * toolbar of the list's own card.
 *
 * It is the card's first row, where the list's title used to be: search,
 * the few choices worth a click each, "More filters", and the result count.
 * As a card of its own above the list it took 150px, and on a short laptop
 * screen the first row of every list started below the fold.
 *
 * Filter state lives in the URL, never in component state, so a filtered view
 * is shareable, the back button behaves, and the table stays a Server
 * Component — this bar is the only part that needs to be interactive.
 */

export interface SelectFilter {
  /** Query-string key. */
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  /** False for a choice that always has a value, such as the sort order. */
  includeAll?: boolean;
  /** Tucked behind "More filters" until opened or set. */
  secondary?: boolean;
  /**
   * Its current value already shows, and can be taken off, somewhere else
   * on the page (the Orders status chips). It then neither opens "More
   * filters" nor gets a chip of its own under the toolbar.
   */
  shownElsewhere?: boolean;
}

export interface DateFilter {
  /** Query-string key. */
  name: string;
  label: string;
  value?: string;
  /** Tucked behind "More filters" until opened or set. */
  secondary?: boolean;
}

/** Two or three choices, shown as toggle chips in the toolbar itself. */
export interface SegmentFilter {
  /** Query-string key. */
  name: string;
  /** What the chips choose between, for a screen reader: "Client type". */
  label: string;
  value?: string;
  /** `title` spells out a label that is an abbreviation (B2B). */
  options: { value: string; label: string; title?: string }[];
}

/** Sentinel for "no filter". An empty string cannot be a Radix Select value. */
export const ALL = "all";

interface SearchFiltersProps {
  search?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  dates?: DateFilter[];
  segments?: SegmentFilter[];
  /**
   * Parameters this bar does not edit but must not drop — a quick-filter tab
   * chosen above it, say. Clearing the filters keeps them too.
   */
  keep?: Record<string, string | undefined>;
  /**
   * The list's heading. Not shown (the page's title already says it), but
   * kept for the outline a screen reader navigates by.
   */
  title?: string;
  /** The end of the toolbar: the list's "Showing 20 / 143". */
  count?: ReactNode;
  /** A card of its own, for a list with no card whose header this could be. */
  standalone?: boolean;
}

const SELECT_CLASS = cn(
  "border-input bg-background h-9 pointer-coarse:h-11 rounded-md border px-3 py-1 text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
);

export function SearchFilters({
  search = "",
  searchPlaceholder,
  selects = [],
  dates = [],
  segments = [],
  keep = {},
  title,
  count,
  standalone = false,
}: SearchFiltersProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(search);

  // Re-sync when the URL changes from elsewhere — a back button press, or the
  // Clear button below. Without this the box keeps showing stale text.
  useEffect(() => setSearchValue(search), [search]);

  const kept = () => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(keep)) if (value) params.set(key, value);
    return params;
  };

  function apply(overrides: Record<string, string> = {}) {
    const params = kept();

    const nextSearch = overrides.search ?? searchValue;
    if (nextSearch.trim()) params.set("search", nextSearch.trim());

    for (const filter of [...segments, ...selects]) {
      const next = overrides[filter.name] ?? filter.value;
      if (next && next !== ALL) params.set(filter.name, next);
    }
    for (const date of dates) {
      const next = overrides[date.name] ?? date.value;
      if (next) params.set(date.name, next);
    }
    // `offset` is deliberately dropped: changing a filter usually shrinks the
    // results, and staying on page 4 of a 2-page result shows an empty table
    // that reads as a bug.

    const query = params.toString();
    if (query !== window.location.search.replace(/^\?/, "")) startNavigationProgress();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  // Search as you type, after a short pause, and on Enter at once (the
  // form's submit). There is no Search button: nobody expects one of a
  // search box any more (audit F40), and it cost the toolbar 100px.
  useEffect(() => {
    if (searchValue.trim() === search.trim()) return;
    const timer = setTimeout(() => apply({ search: searchValue }), 300);
    return () => clearTimeout(timer);
    // `apply` is rebuilt every render; only a change of the text should
    // restart the pause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, search]);

  // The toggle chips are left out of both: a pressed chip already shows
  // that it is in force, and "All" beside it takes it off.
  const inForce = (select: SelectFilter) =>
    Boolean(select.value) && select.includeAll !== false && !select.shownElsewhere;
  const hasFilters = Boolean(search || selects.some(inForce) || dates.some((d) => d.value));

  // The rarely used filters stay folded away, unless one of them is already
  // set: hiding an active filter would leave the list mysteriously short.
  const secondaryCount =
    selects.filter((s) => s.secondary).length + dates.filter((d) => d.secondary).length;
  const secondaryActive =
    selects.filter((s) => s.secondary && inForce(s)).length +
    dates.filter((d) => d.secondary && d.value).length;
  const [showMore, setShowMore] = useState(secondaryActive > 0);

  const clearAll = () => {
    setSearchValue("");
    const query = kept().toString();
    if (query !== window.location.search.replace(/^\?/, "")) startNavigationProgress();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  };

  // One chip per filter in force, each removable on its own. Sort is not a
  // filter, so it gets none.
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(search
      ? [
          {
            key: "search",
            label: `${t("search")}: "${search}"`,
            remove: () => {
              setSearchValue("");
              apply({ search: "" });
            },
          },
        ]
      : []),
    ...selects
      .filter(inForce)
      .map((select) => ({
        key: select.name,
        label: `${select.label}: ${
          select.options.find((option) => option.value === select.value)?.label ?? select.value
        }`,
        remove: () => apply({ [select.name]: "" }),
      })),
    ...dates
      .filter((date) => date.value)
      .map((date) => ({
        key: date.name,
        label: `${date.label}: ${date.value}`,
        remove: () => apply({ [date.name]: "" }),
      })),
  ];

  const options = (select: SelectFilter, allLabel: string) => (
    <>
      {select.includeAll !== false && <option value={ALL}>{allLabel}</option>}
      {select.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );

  // In the toolbar a dropdown has no label above it, so its "all" option
  // carries the name: "Status: all". The name is its accessible label too.
  //
  // Native selects, not Radix: changing one applies it at once, so there is
  // nothing to gain from a custom widget here.
  const toolbarSelect = (select: SelectFilter) => (
    <select
      key={select.name}
      id={select.name}
      aria-label={select.label}
      title={select.label}
      value={select.value ?? ALL}
      onChange={(event) => apply({ [select.name]: event.target.value })}
      className={cn(SELECT_CLASS, "min-w-0 max-sm:flex-1 sm:w-auto sm:max-w-52")}
    >
      {options(select, `${select.label}: ${t("all")}`)}
    </select>
  );

  const selectField = (select: SelectFilter) => (
    <div key={select.name} className="w-full space-y-2 sm:w-44">
      <Label htmlFor={select.name}>{select.label}</Label>
      <select
        id={select.name}
        value={select.value ?? ALL}
        onChange={(event) => apply({ [select.name]: event.target.value })}
        className={cn(SELECT_CLASS, "w-full")}
      >
        {options(select, t("all"))}
      </select>
    </div>
  );

  const dateField = (date: DateFilter) => (
    <div key={date.name} className="w-full space-y-2 sm:w-40">
      <Label htmlFor={date.name}>{date.label}</Label>
      <Input
        // Remounted when the URL changes, so Clear and the back
        // button do not leave a stale date showing.
        key={date.value ?? ""}
        id={date.name}
        type="date"
        defaultValue={date.value ?? ""}
        // Applied when a whole date is picked, not per keystroke of
        // a typed one: a half-typed year is not a filter.
        onChange={(event) => {
          const value = event.target.value;
          if (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            apply({ [date.name]: value });
          }
        }}
      />
    </div>
  );

  const segmentField = (segment: SegmentFilter) => (
    <div key={segment.name} role="group" aria-label={segment.label} className="flex gap-1">
      {[{ value: ALL, label: t("all"), title: undefined }, ...segment.options].map((option) => (
        <ToggleChip
          key={option.value}
          pressed={(segment.value ?? ALL) === option.value}
          title={option.title}
          onClick={() => apply({ [segment.name]: option.value })}
          className="h-9 px-3 text-xs font-medium"
        >
          {option.label}
        </ToggleChip>
      ))}
    </div>
  );

  const toolbar = (
    <div className={cn("space-y-3 px-4 py-3", !standalone && "border-border border-b")}>
      {title && <h2 className="sr-only">{title}</h2>}

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1 basis-56 max-sm:basis-full">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="search"
              name="search"
              // No label above it in a toolbar; the placeholder says what
              // can be searched, and it is gone once something is typed.
              aria-label={t("search")}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              maxLength={255}
              placeholder={searchPlaceholder ?? `${t("search")}…`}
              className="pr-9 pl-9"
            />
            {isPending && (
              <Loader2
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
                aria-hidden
              />
            )}
          </div>

          {segments.map(segmentField)}
          {selects.filter((select) => !select.secondary).map(toolbarSelect)}
          {dates.filter((date) => !date.secondary).map(dateField)}

          {secondaryCount > 0 && (
            <Button
              type="button"
              variant="outline"
              aria-expanded={showMore}
              aria-controls="more-filters"
              onClick={() => setShowMore((open) => !open)}
            >
              <SlidersHorizontal />
              {showMore ? t("fewerFilters") : t("moreFilters")}
              {!showMore && secondaryActive > 0 && (
                <span className="bg-suliko-default-color rounded-full px-1.5 text-xs text-white tabular-nums">
                  {secondaryActive}
                </span>
              )}
              <ChevronDown className={cn("transition-transform", showMore && "rotate-180")} />
            </Button>
          )}

          {count && <div className="ml-auto flex items-center">{count}</div>}
        </div>

        {showMore && secondaryCount > 0 && (
          <div
            id="more-filters"
            className="border-border flex flex-wrap items-end gap-3 border-t pt-3"
          >
            {selects.filter((select) => select.secondary).map(selectField)}
            {dates.filter((date) => date.secondary).map(dateField)}
          </div>
        )}
      </form>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="bg-muted text-foreground inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={chip.remove}
                disabled={isPending}
                aria-label={t("removeFilter", { label: chip.label })}
                className="hover:bg-background text-muted-foreground hover:text-foreground rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground ml-1 text-xs underline-offset-2 hover:underline"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}
    </div>
  );

  return standalone ? <Card className="mb-4 py-0">{toolbar}</Card> : toolbar;
}
