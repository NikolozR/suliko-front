// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Eye, Pencil } from "lucide-react";

import { RowLink } from "@office/shared/components/data/row-link";
import { Button } from "@office/shared/components/ui/button";

/**
 * Open and Edit, as buttons at the end of an order's row.
 *
 * The whole row opens its order when clicked, but nothing on screen says so:
 * someone used to the PHP screen looks for its eye and its pencil, finds
 * neither, and concludes there is no way in from here. The row stays
 * clickable; these are the visible way.
 *
 * `editLabel` is left out for someone who may not edit orders.
 */
export function OrderRowActions({
  orderId,
  viewLabel,
  editLabel,
}: {
  orderId: number;
  /** Names the order, for the tooltip and a screen reader: "Open order #12". */
  viewLabel: string;
  editLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-sm" asChild>
        <RowLink href={`/translations/${orderId}`} aria-label={viewLabel} title={viewLabel}>
          <Eye />
        </RowLink>
      </Button>
      {editLabel && (
        <Button variant="ghost" size="icon-sm" asChild>
          <RowLink href={`/translations/${orderId}/edit`} aria-label={editLabel} title={editLabel}>
            <Pencil />
          </RowLink>
        </Button>
      )}
    </div>
  );
}
