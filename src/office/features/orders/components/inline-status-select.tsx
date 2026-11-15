"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { changeStatusAction, type StatusFormState } from "@office/features/orders/actions";
import { useStatusLabel } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { getStatusHue, normalise, pickableStatuses } from "@office/shared/lib/statuses";
import { cn } from "@office/shared/lib/utils";

/**
 * Change an order's status right from its row — the PHP list let the office
 * move an order along without opening it, and reopening every order just to
 * mark it "picked up" was the single most repetitive click in the old flow.
 *
 * Picking a status only stages it: Apply saves, the cross puts the old one
 * back. It used to save on change, so a single arrow key on a focused
 * dropdown moved an order along with no way back (audit F01, WCAG 3.2.2).
 * A saved change can still be undone from its toast for five seconds.
 *
 * No note here (the note field stays on the order page, for a change that
 * needs an explanation). Gated on `orders.change_status` by the caller —
 * read-only viewers keep seeing the plain badge.
 */
export function InlineStatusSelect({
  orderId,
  orderNumber = orderId,
  current,
  custom = [],
}: {
  orderId: number;
  /** What the toasts call the order: its number in the bureau. */
  orderNumber?: number;
  current: string | null;
  /** The bureau's own statuses, offered after the built-in ones. */
  custom?: readonly string[];
}) {
  const t = useTranslations("orders.list");
  const label = useStatusLabel();
  const [state, formAction, pending] = useActionState<StatusFormState, FormData>(
    changeStatusAction,
    {},
  );

  // The staged choice. Follows the order's real status whenever the page
  // brings a new one (after our own save, or someone else's).
  const [value, setValue] = useState(current ?? "");
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setValue(current ?? "");
  }

  // An older status (Paid, Cancelled…) or imported data is shown as-is but
  // cannot be picked again — the API only accepts the pickable ones.
  const options = pickableStatuses(custom);
  const isPickable = (status: string | null) =>
    status !== null && options.some((s) => normalise(s) === normalise(status));
  const pickable = isPickable(current);
  const dirty = normalise(value) !== normalise(current ?? "");

  // What the last Apply moved the order from and to, for its toast.
  const applied = useRef<{ from: string | null; to: string } | null>(null);

  useEffect(() => {
    const change = applied.current;
    if (!state.ok || !change) return;
    applied.current = null;

    const undo = async () => {
      const formData = new FormData();
      formData.set("id", String(orderId));
      formData.set("status", change.from ?? "");
      const result = await changeStatusAction({}, formData);
      if (result.ok) {
        toast.success(t("statusRestored", { id: orderNumber, status: label(change.from) }));
      } else {
        toast.error(result.error ?? t("undoFailed"));
      }
    };

    toast.success(t("statusChanged", { id: orderNumber, status: label(change.to) }), {
      duration: 5000,
      // Only a status the API still accepts can be put back.
      action: isPickable(change.from) ? { label: t("undo"), onClick: undo } : undefined,
    });
    // `isPickable`, `label` and `t` are stable for this row's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, orderId, orderNumber]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        applied.current = { from: current, to: value };
      }}
      // Never wider than its cell: on a phone the cell is half an order
      // card, and a select left at its own width covered the total beside it.
      className="flex max-w-full flex-col items-start gap-1"
    >
      <input type="hidden" name="id" value={orderId} />
      <div className="flex max-w-full items-center gap-1">
        <div className="relative flex min-w-0 items-center">
          <select
            name="status"
            value={value}
            disabled={pending}
            aria-label={t("status")}
            // A long status is cut at the column's width; this spells it out.
            title={value ? label(value) : undefined}
            onChange={(event) => setValue(event.target.value)}
            className={cn(
              // No wider than 12rem, whatever the longest option is: left to
              // itself a select is as wide as its longest option, and the
              // Georgian ones pushed the Orders table off a laptop screen.
              "border-input h-8 pointer-coarse:h-11 max-w-48 min-w-0 truncate xl:max-w-60 rounded-md border py-0 pr-6 pl-2 text-xs font-medium",
              // Tinted like the soft badge a read-only viewer gets in this
              // cell, so the column reads by colour for everyone. It follows
              // the staged choice.
              HUE_CLASSES[getStatusHue(value)].soft,
              "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              dirty && "border-suliko-default-color",
              pending && "opacity-60",
            )}
          >
            {!pickable && (
              <option value={current ?? ""} disabled className="bg-background text-foreground">
                {current ? label(current) : "–"}
              </option>
            )}
            {options.map((option) => (
              // The open list stays plain: a browser would otherwise paint
              // every option in the select's own tint.
              <option key={option} value={option} className="bg-background text-foreground">
                {label(option)}
              </option>
            ))}
          </select>
          {pending && (
            <Loader2 className="text-muted-foreground pointer-events-none absolute right-1.5 size-3 animate-spin" />
          )}
        </div>

        {dirty && !pending && (
          <>
            <Button
              type="submit"
              variant="brand"
              size="icon-sm"
              aria-label={t("applyStatus", { status: label(value) })}
              title={t("applyStatus", { status: label(value) })}
            >
              <Check />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("keepStatus")}
              title={t("keepStatus")}
              onClick={() => setValue(current ?? "")}
            >
              <X />
            </Button>
          </>
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
