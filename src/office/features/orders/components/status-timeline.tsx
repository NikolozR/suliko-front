"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { changeStatusAction } from "@office/features/orders/actions";
import { StatusBadge, useStatusLabel } from "@office/shared/components/status-badge";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { getStatusHue, normalise, SELECTABLE_STATUSES } from "@office/shared/lib/statuses";
import { cn } from "@office/shared/lib/utils";

/**
 * Where an order is on its way from New to Delivered: the six statuses it
 * can be moved to, as steps. The ones behind it are ticked in the brand colour
 * (one colour for "done", not a rainbow of five), the one it is in is the solid
 * pill in its own status hue, the one the list and the badges use, the ones
 * ahead are hollow.
 *
 * With `canChange`, a step is a button: click one and the order moves there.
 * The marker morphs (a ring becomes the pill as its label grows out of it, the
 * pill shrinks back to a tick) while the save goes through; a failure puts it
 * back. A saved change can be undone from its toast for five seconds, as in the
 * orders list: no confirmation, because the way back is one click.
 *
 * A row when its card is wide enough for six steps, a column when it is not.
 * That is asked of the card, not the screen: beside an open sidebar a tablet
 * leaves each step some 80px, less than one Georgian status needs.
 *
 * On a phone the column of six steps was most of the first screen, ahead of
 * any detail of the order. There it folds to one line: the current status and
 * what comes next, with a button that opens all six (and folds them again once
 * one is picked). Where the row fits it is not folded.
 *
 * An order in an older status (Paid…), a cancelled or rejected one, or one in
 * a status of the bureau's own has no place on this line, so it gets no line:
 * only the pill saying what it is.
 */
export function StatusTimeline({
  status,
  orderId,
  orderNumber,
  canChange = false,
}: {
  status: string | null;
  orderId: number;
  orderNumber: number;
  canChange?: boolean;
}) {
  const t = useTranslations("orders.detail");
  const tl = useTranslations("orders.list");
  const label = useStatusLabel();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const listId = useId();

  // What the line shows: the order's status, or the one just clicked until the
  // save comes back. Follows the order whenever the page brings a new status.
  const [shown, setShown] = useState(status);
  const [seen, setSeen] = useState(status);
  if (seen !== status) {
    setSeen(status);
    setShown(status);
  }

  const current = SELECTABLE_STATUSES.findIndex((step) => normalise(step) === normalise(shown));
  if (current === -1) return <StatusBadge status={shown} variant="solid" />;

  async function send(to: string) {
    const formData = new FormData();
    formData.set("id", String(orderId));
    formData.set("status", to);
    return changeStatusAction({}, formData);
  }

  function move(to: string) {
    if (!canChange || normalise(to) === normalise(shown)) return;
    const from = shown;
    setShown(to);
    setOpen(false);
    startTransition(async () => {
      const result = await send(to);
      if (!result.ok) {
        setShown(from);
        toast.error(result.error ?? tl("undoFailed"));
        return;
      }
      toast.success(tl("statusChanged", { id: orderNumber, status: label(to) }), {
        duration: 5000,
        action: from
          ? {
              label: tl("undo"),
              onClick: async () => {
                const back = await send(from);
                if (back.ok) {
                  setShown(from);
                  toast.success(tl("statusRestored", { id: orderNumber, status: label(from) }));
                } else {
                  toast.error(back.error ?? tl("undoFailed"));
                }
              },
            }
          : undefined,
      });
    });
  }

  const next = SELECTABLE_STATUSES[current + 1];

  return (
    <div className="@container">
      {/* Only where the steps are a column; the row has no need of it. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] @2xl:hidden",
          open && "mb-2",
        )}
      >
        <StatusBadge status={shown} variant="solid" />
        <span className="text-muted-foreground min-w-0 flex-1 text-sm">
          {next ? t("nextStep", { status: label(next) }) : t("lastStep")}
        </span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
          {open ? t("hideSteps") : t("allSteps")}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>
      <ol
        id={listId}
        aria-label={t("progress")}
        className={cn(
          "isolate flex flex-col gap-3 @2xl:flex-row @2xl:gap-0",
          !open && "@max-2xl:hidden",
        )}
      >
        {SELECTABLE_STATUSES.map((step, index) => {
          const done = index < current;
          const here = index === current;
          const hue = HUE_CLASSES[getStatusHue(step)];

          const marker = (
            // The same element in every state, so its width, colour and label
            // can change under the eye: a ring, a tick, or the pill with its
            // label opened out of it. As tall as a marker, so the line meets
            // its middle.
            <span
              aria-hidden={!here}
              className={cn(
                "relative z-10 inline-flex h-6 min-w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium whitespace-nowrap",
                "transition-[background-color,border-color,padding,color] duration-300 ease-out",
                here
                  ? [hue.solid, "px-2.5"]
                  : done
                    ? "bg-suliko-default-color text-white"
                    : "border-muted-foreground/40 bg-card border-2",
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0 transition-[opacity,width,margin] duration-300",
                  done ? "opacity-100" : "w-0 opacity-0",
                )}
                strokeWidth={3}
              />
              <span
                className={cn(
                  "block overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
                  here ? "max-w-[18rem] opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {label(step)}
              </span>
            </span>
          );

          return (
            <li
              key={step}
              aria-current={here ? "step" : undefined}
              className="relative flex items-center gap-3 @2xl:flex-1 @2xl:flex-col @2xl:gap-2 @2xl:text-center"
            >
              {/* The line back to the step before: down the left in a
                  column, across the middle of the markers in a row. */}
              {index > 0 && (
                <span
                  aria-hidden
                  className="bg-border absolute -top-3 left-3 h-3 w-px @2xl:top-3 @2xl:right-1/2 @2xl:-left-1/2 @2xl:h-px @2xl:w-auto"
                />
              )}

              {canChange ? (
                <button
                  type="button"
                  onClick={() => move(step)}
                  aria-label={label(step)}
                  className={cn(
                    "group flex items-center gap-3 rounded-full outline-none @2xl:flex-col @2xl:gap-2",
                    "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    !here && "cursor-pointer",
                  )}
                >
                  {marker}
                  <StepLabel label={label(step)} done={done} here={here} t={t} interactive />
                </button>
              ) : (
                <>
                  {marker}
                  <StepLabel label={label(step)} done={done} here={here} t={t} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The word under a marker. The current step says it in its pill, so its own collapses. */
function StepLabel({
  label,
  done,
  here,
  t,
  interactive = false,
}: {
  label: string;
  done: boolean;
  here: boolean;
  t: (key: "stepDone" | "stepAhead") => string;
  interactive?: boolean;
}) {
  return (
    <span
      // The current step says its name in the pill; this copy only collapses.
      aria-hidden={here || undefined}
      className={cn(
        "text-xs transition-[opacity,max-height] duration-300",
        here ? "max-h-0 overflow-hidden opacity-0 @2xl:max-h-0" : "max-h-8 opacity-100",
        done ? "text-foreground" : "text-muted-foreground",
        interactive && !here && "group-hover:text-foreground",
      )}
    >
      {label}
      {!here && <span className="sr-only"> {done ? t("stepDone") : t("stepAhead")}</span>}
    </span>
  );
}
