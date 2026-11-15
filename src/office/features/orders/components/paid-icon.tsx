// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import type { PaidState } from "@office/features/orders/types";
import { cn } from "@office/shared/lib/utils";

/**
 * Tri-state payment marker, shown beside the price on every order row.
 *
 * Port of the PHP's `paid_status_icon_html`. All three states matter: "nothing
 * paid" and "partly paid" are different conversations with a client, and
 * collapsing them into a single "unpaid" flag loses the distinction staff
 * actually act on.
 *
 * A small dot in the state's hue. It used to be a circled cross, tick or
 * minus, and a red circled cross beside every total read as a delete button
 * or an error. The state is in the title and, for a screen reader, in words;
 * wherever the money is the subject (the order's summary, the Unpaid tab)
 * it is spelled out beside the figure as well.
 */

const DOTS: Record<PaidState, string> = {
  paid: "bg-hue-green-ink",
  partial: "bg-hue-amber-ink",
  unpaid: "bg-hue-red-ink",
};

export function PaidIcon({ state, className }: { state: PaidState; className?: string }) {
  const t = useTranslations("enums.paidState");
  const known = state in DOTS ? state : "unpaid";
  const label = t(known);

  return (
    // Wider than the dot it holds, so the title is not a 6px target.
    <span
      title={label}
      className={cn("inline-flex size-3 shrink-0 items-center justify-center", className)}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOTS[known])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * What the dots beside the totals mean, in words, under the list.
 *
 * The dot's own `title` only shows on hover, and a phone has no hover: a
 * green, amber or red dot with nothing to explain it is colour alone. The
 * list's rows already announce the state to a screen reader, so this line is
 * for eyes only.
 */
export function PaidLegend({ className }: { className?: string }) {
  const t = useTranslations("enums.paidState");
  const states: PaidState[] = ["paid", "partial", "unpaid"];
  return (
    <ul
      aria-hidden
      className={cn("text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs", className)}
    >
      {states.map((state) => (
        <li key={state} className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", DOTS[state])} />
          {t(state)}
        </li>
      ))}
    </ul>
  );
}
