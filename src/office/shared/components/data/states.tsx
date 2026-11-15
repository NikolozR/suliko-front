// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, Inbox, SearchX, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@office/i18n/navigation";
import { IconChip } from "@office/shared/components/icon-chip";
import { Button } from "@office/shared/components/ui/button";
import type { Hue } from "@office/shared/lib/hues";

import { Skeleton } from "@office/shared/components/ui/skeleton";
import { TableCell, TableRow } from "@office/shared/components/ui/table";

/**
 * The three states every list screen needs besides "here is your data":
 * nothing exists yet, nothing matched the filters, and something broke.
 *
 * Kept distinct on purpose. "No clients yet" and "no clients match your
 * search" look identical if you reuse one component, and the second one leaves
 * people thinking their data is gone.
 *
 * The icon sits on a chip: the module's hue for "nothing yet", red for a
 * failure, grey for the rest. The title still says which state it is.
 */

function State({
  icon,
  title,
  body,
  action,
  hue = "grey",
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  hue?: Hue;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {/* Two faint rings behind the chip give an empty list some presence. */}
      <span className="relative grid size-24 place-items-center" aria-hidden>
        <span className="border-border/60 absolute inset-0 rounded-full border" />
        <span className="border-border/40 absolute -inset-3 rounded-full border border-dashed" />
        <IconChip icon={icon} hue={hue} size="lg" className="rounded-xl" />
      </span>
      <p className="font-medium">{title}</p>
      {body && <p className="text-muted-foreground max-w-sm text-sm">{body}</p>}
      {action}
    </div>
  );
}

/**
 * Nothing has been created yet. Offer the action that fixes that.
 *
 * `hue` is the module's: pass `sectionMark("clients").hue`.
 */
export function EmptyState({
  title,
  body,
  action,
  hue,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  hue?: Hue;
}) {
  return (
    <State icon={Inbox} title={title} body={body} action={action} hue={hue} />
  );
}

/** Records exist, but none match the current filters. */
export function NoResultsState({ action }: { action?: ReactNode }) {
  const t = useTranslations("states");
  return (
    <State
      icon={SearchX}
      title={t("noResultsTitle")}
      body={t("noResultsBody")}
      action={action}
    />
  );
}

/**
 * The page asked for is past the end of the list — a stale link, or the last
 * row on the last page was deleted. Records exist, so "nothing here yet"
 * would be a lie; this offers the way back instead.
 */
export function PastLastPageState({
  firstPageHref,
}: {
  firstPageHref: string;
}) {
  const t = useTranslations("states");
  return (
    <State
      icon={SearchX}
      title={t("pastLastPageTitle")}
      body={t("pastLastPageBody")}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={firstPageHref}>{t("firstPage")}</Link>
        </Button>
      }
    />
  );
}

/** The fetch failed. */
export function ErrorState({
  message,
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  const t = useTranslations("states");
  return (
    <State
      icon={AlertTriangle}
      title={t("errorTitle")}
      body={message ?? t("errorBody")}
      action={action}
      hue="red"
    />
  );
}

/**
 * Skeleton rows sized to the real table.
 *
 * Matching the column count matters: a skeleton with a different shape from
 * the content it replaces produces a visible jump on load, which reads as a
 * bug even though nothing is wrong.
 */
export function TableSkeleton({
  rows = 8,
  columns,
}: {
  rows?: number;
  columns: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
