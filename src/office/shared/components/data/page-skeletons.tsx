// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { IconChip } from "@office/shared/components/icon-chip";
import { PageHeader } from "@office/shared/components/page-header";
import { TableSkeleton } from "@office/shared/components/data/states";
import { Card, CardContent, CardHeader } from "@office/shared/components/ui/card";
import { Skeleton } from "@office/shared/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { cn } from "@office/shared/lib/utils";

/**
 * Placeholders shown by each screen's `loading.tsx` while the server fetches.
 *
 * Without one, clicking a link in the sidebar appears to do nothing until the
 * whole page has arrived, which on a slow connection reads as a dead click.
 * Each shape follows the real screen (header, filter bar, table; or a
 * two-thirds main column with a side column) so the data fills in rather
 * than pushing the layout around.
 *
 * The title is passed in when the screen's own title is known up front, so
 * the heading stays put across the swap. Detail screens title themselves
 * after the record, which is not known yet, so they get a bar instead.
 *
 * `section` is the screen's sidebar entry ("clients"). The real header
 * carries that section's icon chip, so the placeholder does too: without it
 * the title would jump sideways by the chip's width when the page arrives.
 */

/** The section's chip, as `PageHeader` draws it. Nothing for an unknown section. */
function SectionChip({ section }: { section?: string }) {
  const { icon, hue } = sectionMark(section ?? "");
  return icon ? <IconChip icon={icon} hue={hue ?? "grey"} /> : null;
}

function TitleBar() {
  return <Skeleton className="h-8 w-56" />;
}

function Header({
  title,
  description,
  section,
}: {
  title?: string;
  description?: boolean;
  section?: string;
}) {
  if (title) {
    return (
      <div className="border-border mb-6 flex items-start gap-3 border-b pb-4">
        <SectionChip section={section} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{title}</h1>
          {description && <Skeleton className="mt-2 h-4 w-80 max-w-full" />}
        </div>
      </div>
    );
  }
  return (
    <div className="border-border mb-6 flex items-center justify-between gap-3 border-b pb-4">
      <div className="flex items-center gap-3">
        <SectionChip section={section} />
        <TitleBar />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

/** Label-over-value pairs, the shape of a `DetailList` or a form field. */
function Fields({ count, columns = 2 }: { count: number; columns?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-5", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-full max-w-40" />
        </div>
      ))}
    </div>
  );
}

function BlockCard({ fields, columns }: { fields: number; columns?: 2 | 3 }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Fields count={fields} columns={columns} />
      </CardContent>
    </Card>
  );
}

/** A list screen: optional quick tabs, then the table under its toolbar. */
export function ListPageSkeleton({
  title,
  columns,
  quickTabs = 0,
  chips = 0,
  filters = 2,
  stats = 0,
  filterCard = false,
  cards = false,
  section,
}: {
  title: string;
  columns: number;
  section?: string;
  /** Pills above the filter bar (Translations' All / Overdue / …). */
  quickTabs?: number;
  /** Status chips under the quick tabs (Translations). */
  chips?: number;
  /** Dropdowns and buttons beside the search box. */
  filters?: number;
  /**
   * The filters as a card of their own above the list, for the screens that
   * still have one. Everywhere else they are the list card's first row.
   */
  filterCard?: boolean;
  /** Summary cards above the list (Finances). */
  stats?: number;
  /**
   * The list is cards, not a table, below `md` (Orders: `stack-orders`).
   * The placeholder follows, so the page does not jump from seven grey
   * columns to a stack of cards when the data arrives.
   */
  cards?: boolean;
}) {
  return (
    <>
      <PageHeader {...sectionMark(section ?? "")} title={title} />

      {stats > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: stats }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {quickTabs > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Array.from({ length: quickTabs }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24" />
          ))}
        </div>
      )}

      {chips > 0 && (
        <div className="mb-2 flex gap-1.5 overflow-hidden py-1">
          {Array.from({ length: chips }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      )}

      {filterCard && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <Skeleton className="h-9 min-w-56 flex-1" />
            {Array.from({ length: filters }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-40" />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden py-0">
        {filterCard ? (
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
        ) : (
          // The toolbar: search, the dropdowns, the result count.
          <div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <Skeleton className="h-9 min-w-48 flex-1 basis-56" />
            {Array.from({ length: filters }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-36" />
            ))}
            <Skeleton className="ml-auto h-6 w-36 rounded-full" />
          </div>
        )}
        <CardContent className="p-0">
          {cards && <CardListSkeleton rows={6} className="md:hidden" />}
          <div className={cn(cards && "max-md:hidden")}>
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: columns }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-3 w-16" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton rows={10} columns={columns} />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * The phone's order cards while they load: the client and the total on one
 * line, the number and the status on the next, as `stack-orders` lays them out.
 */
function CardListSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <div className={cn("divide-border divide-y", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-4 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One record: main column of field cards, side column of summary cards. */
export function DetailPageSkeleton({
  section,
  timeline = false,
}: {
  section?: string;
  /** The order page's status timeline, a card across the top. */
  timeline?: boolean;
}) {
  return (
    <>
      <Header section={section} />
      {timeline && (
        <Card className="mb-4 py-4">
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BlockCard fields={6} columns={3} />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <BlockCard fields={4} />
          <BlockCard fields={2} />
        </div>
      </div>
    </>
  );
}

/** A create or edit screen: cards of label + input pairs, then the buttons. */
export function FormPageSkeleton({
  title,
  sidebar = false,
  section,
}: {
  title?: string;
  sidebar?: boolean;
  section?: string;
}) {
  const fields = (
    <div className="space-y-4">
      {[6, 4].map((count, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: count }).map((_, field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );

  return (
    <>
      <Header title={title} section={section} />
      {sidebar ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">{fields}</div>
          <BlockCard fields={4} />
        </div>
      ) : (
        <div className="max-w-3xl">{fields}</div>
      )}
    </>
  );
}

/** Settings and similar: a row of tabs over a card of fields. */
export function TabbedPageSkeleton({
  title,
  tabs = 5,
  section,
}: {
  title: string;
  tabs?: number;
  section?: string;
}) {
  return (
    <>
      <Header title={title} description section={section} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {Array.from({ length: tabs }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <BlockCard fields={8} />
    </>
  );
}

/** The dashboard: four figure cards, the status board, the recent orders. */
export function DashboardSkeleton({ title, section }: { title: string; section?: string }) {
  return (
    <>
      <PageHeader {...sectionMark(section ?? "")} title={title} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        {/* The pipeline's three layouts: see StatusPipeline. */}
        <CardContent className="flex gap-2 overflow-hidden md:grid md:grid-cols-3 md:gap-3 xl:grid-cols-6 xl:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 min-w-36 flex-1 rounded-lg md:min-w-0" />
          ))}
        </CardContent>
      </Card>
      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableSkeleton rows={8} columns={5} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
