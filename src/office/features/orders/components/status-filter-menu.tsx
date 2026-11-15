"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, ChevronDown, X } from "lucide-react";

import { RowLink } from "@office/shared/components/data/row-link";
import { useStatusLabel } from "@office/shared/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@office/shared/components/ui/dropdown-menu";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { getStatusHue } from "@office/shared/lib/statuses";
import { cn } from "@office/shared/lib/utils";

export interface StatusOption {
  status: string;
  /** The list with this status chosen (or, for the chosen one, without it). */
  href: string;
  /** How many orders are in it; the chosen one shows the whole result. */
  count: number | undefined;
  selected: boolean;
}

/**
 * The orders list's status filter: one menu at the end of the quick filters,
 * where six coloured chips used to make a second row. The colour stays, as a
 * dot, and the count beside each status says how many orders it would show.
 *
 * Choosing a status is a link, so the URL carries it (`?status=`) and a
 * shared address, the back button and Export keep the view. The chosen status
 * is named on the button, and the cross next to it takes the filter off.
 */
export function StatusFilterMenu({
  label,
  clearLabel,
  options,
  clearHref,
}: {
  label: string;
  clearLabel: string;
  options: StatusOption[];
  clearHref: string;
}) {
  const statusLabel = useStatusLabel();
  const chosen = options.find((option) => option.selected);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-[38px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              chosen
                ? "border-suliko-default-color text-suliko-default-color bg-card"
                : "border-border/70 bg-muted/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {chosen ? (
              <>
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", HUE_CLASSES[getStatusHue(chosen.status)].dot)}
                />
                {statusLabel(chosen.status)}
              </>
            ) : (
              label
            )}
            <ChevronDown className="size-3.5 opacity-70" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {options.map((option) => (
            <DropdownMenuItem key={option.status} asChild>
              <RowLink href={option.href} className="flex cursor-pointer items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-full", HUE_CLASSES[getStatusHue(option.status)].dot)}
                />
                <span className="flex-1">{statusLabel(option.status)}</span>
                {option.selected ? (
                  <Check className="text-suliko-default-color size-4" aria-hidden />
                ) : (
                  option.count !== undefined && (
                    <span className="text-muted-foreground text-xs tabular-nums">{option.count}</span>
                  )
                )}
              </RowLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {chosen && (
        <RowLink
          href={clearHref}
          aria-label={clearLabel}
          title={clearLabel}
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md"
        >
          <X className="size-4" aria-hidden />
        </RowLink>
      )}
    </div>
  );
}
