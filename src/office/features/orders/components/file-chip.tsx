"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, X, type LucideIcon } from "lucide-react";

import { fileGlyph } from "@office/features/orders/file-glyph";
import { Button } from "@office/shared/components/ui/button";
import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

/** Where a file stands: saved, waiting for Save, on its way, failed. */
export interface FileChipState {
  hue: Hue;
  icon: LucideIcon;
  label: string;
  /** The icon is a spinner. */
  busy?: boolean;
}

/**
 * One file on the order form: what kind it is, its name, and where it stands.
 *
 * The name is in the text colour and the state is a coloured pill, because a
 * chosen file used to be one grey line that read the same as "nothing chosen".
 * Below `@md` of the card around it the pill keeps its icon and drops its
 * words, and the note goes under the name, so the name is not squeezed out
 * on a phone.
 */
export function FileChip({
  name,
  contentType,
  note,
  state,
  href,
  onRemove,
  removeLabel,
  arriving = false,
}: {
  name: string;
  contentType: string;
  /** Size, side: one quiet word or two after the name. */
  note?: string;
  state?: FileChipState;
  /** Makes the name a link to the stored file. */
  href?: string;
  onRemove?: () => void;
  removeLabel?: string;
  /** Just chosen: it slides in. A stored file is simply there. */
  arriving?: boolean;
}) {
  const { icon: Glyph, ink } = fileGlyph(name, contentType);
  const StateIcon = state?.busy ? Loader2 : state?.icon;

  return (
    <li
      className={cn(
        "bg-card border-border flex min-h-10 items-center gap-2.5 rounded-md border px-2.5 py-1 text-sm shadow-xs transition-shadow duration-200 hover:shadow-sm",
        arriving && "animate-in fade-in-0 slide-in-from-left-2 duration-200",
      )}
    >
      <Glyph className={cn("size-5 shrink-0", ink)} aria-hidden />
      {/* The note sits under the name until the card is wide enough to give
          both a line: beside it on a phone, the name was left 35px. */}
      <span className="min-w-0 flex-1 @md:flex @md:items-center @md:gap-2.5">
        {href ? (
          <a
            href={href}
            title={name}
            className="hover:text-link block truncate font-medium hover:underline @md:flex-1"
          >
            {name}
          </a>
        ) : (
          <span className="block truncate font-medium @md:flex-1" title={name}>
            {name}
          </span>
        )}
        {note && (
          <span className="text-muted-foreground block truncate text-xs tabular-nums @md:shrink-0">
            {note}
          </span>
        )}
      </span>
      {state && StateIcon && (
        <span
          title={state.label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-300",
            HUE_CLASSES[state.hue].soft,
          )}
        >
          <StateIcon className={cn("size-3.5", state.busy && "animate-spin")} aria-hidden />
          <span className="sr-only @md:not-sr-only">{state.label}</span>
        </span>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-mr-1 shrink-0"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={onRemove}
        >
          <X />
        </Button>
      )}
    </li>
  );
}
