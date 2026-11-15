// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, Hash, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { DIRECTORY_PAGE_SIZE } from "@office/features/directory/types";
import { listOrders, type OrderListParams } from "@office/features/orders/api";
import { StatusFilterMenu } from "@office/features/orders/components/status-filter-menu";
import { InlineStatusSelect } from "@office/features/orders/components/inline-status-select";
import type { OrderSummary } from "@office/features/orders/types";
import { PaidIcon, PaidLegend } from "@office/features/orders/components/paid-icon";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { ExportButton } from "@office/shared/components/data/export-button";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
import {
  EmptyState,
  NoResultsState,
  PastLastPageState,
} from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { ClientTypeBadge, StatusBadge } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@office/shared/components/ui/table";
import { TooltipProvider } from "@office/shared/components/ui/tooltip";
import { ClickableRow } from "@office/shared/components/data/clickable-row";
import { RowLink } from "@office/shared/components/data/row-link";
import { sectionMark } from "@office/shared/config/navigation";
import { formatDate } from "@office/shared/lib/dates";
import type { Hue } from "@office/shared/lib/hues";
import { formatMoneyString } from "@office/shared/lib/money";
import {
  getStatusLabel,
  normalise,
  pickableStatuses,
  SELECTABLE_STATUSES,
  statusMessageKey,
} from "@office/shared/lib/statuses";
import { tolerate } from "@office/shared/lib/tolerate";
import {
  SegmentedCount,
  SegmentedNav,
  segmentedItem,
} from "@office/shared/components/segmented";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** The PHP office's four questions, one click each. */
const QUICK_FILTERS = ["overdue", "dueToday", "unpaid", "mine"] as const;
type QuickFilter = (typeof QUICK_FILTERS)[number];

/**
 * The colour of each tab's count while there is something in it: red for
 * what is late or owed, amber for today. Blue and grey tabs keep a plain
 * number, and a count of 0 is plain whichever tab it is on, so an empty Overdue
 * does not look like an alarm.
 */
const QUICK_HUES: Record<QuickFilter | "all", Hue> = {
  all: "grey",
  overdue: "red",
  dueToday: "amber",
  unpaid: "red",
  mine: "blue",
};

const SORTS = ["-id", "id", "due", "-due"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABELS: Record<Sort, "newest" | "oldest" | "dueSoon" | "dueLate"> = {
  "-id": "newest",
  id: "oldest",
  due: "dueSoon",
  "-due": "dueLate",
};

const isDate = (value: string | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

export const generateMetadata = pageTitle("orders");

/** An order's due date: grey, or red with a warning sign once it is overdue. */
function DueDate({
  order,
  overdueLabel,
}: {
  order: OrderSummary;
  overdueLabel: string;
}) {
  if (!order.due_date) return <span className="text-muted-foreground">–</span>;
  return (
    <span
      className={cn(
        // Not text-destructive: under the row's blue hover that is 4.46:1,
        // this is 5.3:1.
        order.is_overdue
          ? "text-hue-red-ink font-medium"
          : "text-muted-foreground",
      )}
    >
      {order.is_overdue && (
        <AlertTriangle
          className="mr-1 inline size-3"
          aria-label={overdueLabel}
        />
      )}
      {formatDate(order.due_date)}
    </span>
  );
}

/**
 * Money arrives as a decimal string and stays one — only grouping is added.
 * Parsing to a JS number would undo the precision the backend preserves.
 */
export default async function OrdersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requirePermission("orders.read", locale);

  const t = await getTranslations("nav");
  const to = await getTranslations("orders");
  const tl = await getTranslations("orders.list");
  const tc = await getTranslations("common");
  const ts = await getTranslations("statuses");
  const tt = await getTranslations("enums.clientType");
  const query = await searchParams;

  const search = one(query.search);
  const rawType = one(query.client_type);
  const clientType =
    rawType === "B2B" || rawType === "B2C" ? rawType : undefined;
  const statusFilter = one(query.status);
  const language = one(query.language);
  const dateFrom = isDate(one(query.date_from));
  const dateTo = isDate(one(query.date_to));
  // On a one-person plan every order is yours, so "My orders" would only
  // repeat "All" under another name. The tab is left out there, and an old
  // link to it shows all orders.
  const quickFilters: readonly QuickFilter[] =
    session.plan === "freelancer"
      ? QUICK_FILTERS.filter((key) => key !== "mine")
      : QUICK_FILTERS;
  const rawQuick = one(query.quick);
  const quick = quickFilters.includes(rawQuick as QuickFilter)
    ? (rawQuick as QuickFilter)
    : undefined;
  const rawSort = one(query.sort);
  const sort: Sort = SORTS.includes(rawSort as Sort)
    ? (rawSort as Sort)
    : "-id";
  const offset = Math.max(
    0,
    Number.parseInt(one(query.offset) ?? "0", 10) || 0,
  );
  // From a client's page: "All of this client's orders".
  const rawClient = one(query.client_id);
  const clientId =
    rawClient && /^\d{1,10}$/.test(rawClient) ? Number(rawClient) : undefined;

  // Everything the filter bar sets. The quick tabs narrow it further, and
  // their counts are taken against it, so "Overdue 3" means three overdue
  // orders among the ones the search and dropdowns already allow.
  const barFilters: OrderListParams = {
    search,
    clientType,
    status: statusFilter,
    language,
    clientId,
    dateFrom,
    dateTo,
  };
  const quickFlags = (key: QuickFilter | undefined): OrderListParams => ({
    overdue: key === "overdue",
    dueToday: key === "dueToday",
    unpaid: key === "unpaid",
    mine: key === "mine",
  });
  const filters: OrderListParams = {
    ...barFilters,
    ...quickFlags(quick),
    sort,
  };

  // One row each: only `meta.total` is wanted. A failed count shows no
  // number rather than failing the page. "All" reuses the main list's total
  // when no tab is chosen.
  //
  // The status chips under the tabs are counted the same way, one status
  // each. Theirs keep the chosen quick tab, as the chip's link does, so the
  // number on a chip is the number of rows it opens.
  const tabs: (QuickFilter | undefined)[] = [undefined, ...quickFilters];
  const isChosenStatus = (status: string) =>
    Boolean(statusFilter) && normalise(status) === normalise(statusFilter);
  const [result, reference, tabResults, chipResults] = await Promise.all([
    tolerate(listOrders({ ...filters, offset, limit: DIRECTORY_PAGE_SIZE })),
    tolerate(getReference()),
    Promise.all(
      tabs.map((key) =>
        key === quick
          ? null
          : tolerate(
              listOrders({ ...barFilters, ...quickFlags(key), limit: 1 }),
            ),
      ),
    ),
    Promise.all(
      SELECTABLE_STATUSES.map((status) =>
        isChosenStatus(status)
          ? null
          : tolerate(
              listOrders({
                ...barFilters,
                ...quickFlags(quick),
                status,
                limit: 1,
              }),
            ),
      ),
    ),
  ]);
  const tabCounts = new Map(
    tabs.map((key, index) => [
      key,
      key === quick
        ? result.data?.meta.total
        : tabResults[index]?.data?.meta.total,
    ]),
  );
  const chipCounts = new Map(
    SELECTABLE_STATUSES.map((status, index) => [
      status,
      isChosenStatus(status)
        ? result.data?.meta.total
        : chipResults[index]?.data?.meta.total,
    ]),
  );

  const canSeeProfit = session.permissions.includes("reports.profit");
  const canChangeStatus = session.permissions.includes("orders.change_status");
  // A freelancer's plan has no translators (they ARE the translator), so
  // the column would be a dash on every row forever. The permission is the
  // one the sidebar's Translators entry asks for.
  const canSeeTranslators = session.permissions.includes("translators.read");
  // `quiet`: the header's copy on a phone drops to an outline. The bottom
  // bar's round "+" is the filled button there (it is on every screen), so
  // the screen keeps one primary; the labelled button stays for whoever has
  // not found the plus yet. The empty state and the error state keep the
  // filled one: with no list to look at, it is the one thing to do.
  const newOrder = (quiet = false) => (
    <Can permission="orders.write">
      <Button
        variant="brand"
        size="sm"
        asChild
        className={cn(
          quiet &&
            "max-md:border max-md:bg-background max-md:text-foreground max-md:hover:bg-accent max-md:dark:bg-input/30 max-md:dark:hover:bg-input/50 dark:max-md:border-input",
        )}
      >
        <Link href="/translations/new" data-tip="translations-new">
          <Plus /> {to("newOrder")}
        </Link>
      </Button>
    </Can>
  );

  if (!result.data) {
    return (
      <>
        <PageHeader
          {...sectionMark("translations")}
          title={t("translations")}
          actions={newOrder()}
        />
        <ApiUnavailable
          error={result.error}
          what={to("title")}
          endpoints={["GET /api/v1/orders"]}
        />
      </>
    );
  }

  const { items, meta } = result.data;
  // Nor is it worth its width on a page where nobody is assigned yet.
  const showTranslators =
    canSeeTranslators &&
    items.some((order) => (order.translator_names?.length ?? 0) > 0);
  const languages = reference.data?.languages ?? [];
  const languageName = (code: string) => {
    const found = languages.find((l) => l.code === code);
    if (!found) return code.toUpperCase();
    return locale === "ka" ? found.name_ka || found.name_en : found.name_en;
  };

  // Everything but the offset, so paging, the quick tabs and Export all carry
  // the current view.
  const current: Record<string, string | undefined> = {
    search,
    client_type: rawType,
    status: statusFilter,
    language,
    client_id: clientId ? String(clientId) : undefined,
    date_from: dateFrom,
    date_to: dateTo,
    quick,
    sort: sort === "-id" ? undefined : sort,
  };
  const withParams = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, ...patch })) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/translations?${qs}` : "/translations";
  };

  const hasFilters = Boolean(
    search ||
    rawType ||
    statusFilter ||
    language ||
    dateFrom ||
    dateTo ||
    quick ||
    clientId,
  );

  return (
    <TooltipProvider>
      <PageHeader
        {...sectionMark("translations")}
        title={t("translations")}
        actions={
          <div className="flex gap-2">
            <ExportButton resource="orders" params={current} />
            {newOrder(true)}
          </div>
        }
      />

      <div className="mb-3 flex items-center gap-2 sm:flex-wrap">
        <SegmentedNav label={tl("title")} className="min-w-0">
          {tabs.map((key) => {
            const selected = quick === key;
            const count = tabCounts.get(key);
            return (
              <RowLink
                key={key ?? "all"}
                href={withParams({ quick: key })}
                aria-current={selected ? "page" : undefined}
                className={segmentedItem(selected)}
              >
                {tl(`quick.${key ?? "all"}`)}
                {count !== undefined && (
                  <SegmentedCount
                    selected={selected}
                    tone={
                      selected || count === 0
                        ? undefined
                        : QUICK_HUES[key ?? "all"] === "red"
                          ? "danger"
                          : QUICK_HUES[key ?? "all"] === "amber"
                            ? "warning"
                            : undefined
                    }
                  >
                    {count}
                  </SegmentedCount>
                )}
              </RowLink>
            );
          })}
        </SegmentedNav>
        {/* The six statuses are one menu at the end of the row (they were a
            second row of coloured chips): the dot keeps each one's colour. */}
        <div className="shrink-0">
        <StatusFilterMenu
          label={tl("status")}
          clearLabel={tc("clear")}
          clearHref={withParams({ status: undefined })}
          options={SELECTABLE_STATUSES.map((status) => ({
            status,
            selected: isChosenStatus(status),
            href: withParams({
              status: isChosenStatus(status) ? undefined : status,
            }),
            count: chipCounts.get(status),
          }))}
        />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {/* The list's toolbar: search, the sort order and the rest behind
            "More filters". Status is in there too, for a status of the
            bureau's own: the six everyone has are the chips above. */}
        <SearchFilters
          title={tl("title")}
          count={
            <ResultCount
              shown={items.length}
              total={meta.total}
              entity={to("entity")}
            />
          }
          search={search}
          searchPlaceholder={tl("searchPlaceholder")}
          keep={{ quick, client_id: clientId ? String(clientId) : undefined }}
          selects={[
            {
              name: "client_type",
              label: tl("clientType"),
              value: rawType,
              secondary: true,
              options: [
                { value: "B2B", label: tt("B2B") },
                { value: "B2C", label: tt("B2C") },
              ],
            },
            {
              name: "status",
              label: tl("status"),
              value: statusFilter,
              secondary: true,
              // One of the six is already a pressed chip above the card.
              shownElsewhere: SELECTABLE_STATUSES.some(isChosenStatus),
              // The statuses an order can be in from now on, the bureau's own
              // included. Older ones stay on their orders but are not offered.
              options: pickableStatuses(reference.data?.custom_statuses).map(
                (value) => ({
                  value,
                  label: ts.has(statusMessageKey(value))
                    ? ts(statusMessageKey(value))
                    : getStatusLabel(value),
                }),
              ),
            },
            ...(languages.length > 0
              ? [
                  {
                    name: "language",
                    label: tl("language"),
                    value: language,
                    secondary: true,
                    options: languages.map((l) => ({
                      value: l.code,
                      label: languageName(l.code),
                    })),
                  },
                ]
              : []),
            {
              name: "sort",
              label: tl("sort.label"),
              value: sort === "-id" ? undefined : sort,
              includeAll: false,
              options: SORTS.map((value) => ({
                value,
                label: tl(`sort.${SORT_LABELS[value]}`),
              })),
            },
          ]}
          dates={[
            {
              name: "date_from",
              label: tl("dateFrom"),
              value: dateFrom,
              secondary: true,
            },
            {
              name: "date_to",
              label: tl("dateTo"),
              value: dateTo,
              secondary: true,
            },
          ]}
        />

        <CardContent className="p-0">
          {items.length === 0 ? (
            meta.total > 0 && offset > 0 ? (
              <PastLastPageState firstPageHref={withParams({})} />
            ) : hasFilters ? (
              <NoResultsState
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/translations">{tc("clearFilters")}</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                hue={sectionMark("translations").hue}
                title={tl("emptyTitle")}
                body={tl("emptyBody")}
                action={newOrder()}
              />
            )
          ) : (
            <>
              <div className="custom_scroll">
                <Table className="stack-mobile stack-orders">
                  <TableHeader>
                    <TableRow>
                      {/* Sized to fit beside the open sidebar on a 1280px
                          laptop, some 900px: the two dates share a column,
                          as do documents and pages, and there is no edit
                          column (the row opens the order, which has Edit). */}
                      <TableHead className="w-12" title={tl("order")}>
                        <span aria-hidden>{tl("number")}</span>
                        <span className="sr-only">{tl("order")}</span>
                      </TableHead>
                      {/* Two lines, as the cells under it are. */}
                      <TableHead className="w-24 leading-tight">
                        <span className="block">{tl("date")}</span>
                        <span className="text-muted-foreground block text-xs font-normal">
                          {tl("due")}
                        </span>
                      </TableHead>
                      <TableHead>{to("client")}</TableHead>
                      {showTranslators && (
                        <TableHead>{to("translator")}</TableHead>
                      )}
                      <TableHead className="w-48 xl:w-60">{tl("status")}</TableHead>
                      <TableHead className="w-20 text-right">
                        {tl("docsPages")}
                      </TableHead>
                      <TableHead className="w-28 text-right">
                        {tl("totalCol")}
                      </TableHead>
                      {canSeeProfit && (
                        <TableHead className="w-24 text-right lg:max-xl:hidden">
                          {tl("profit")}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {items.map((order) => (
                      <ClickableRow
                        key={order.id}
                        href={`/translations/${order.id}`}
                        // The few orders that carry the client's own reference
                        // (tenders) stand out by a faint tint and a chip,
                        // not by a column that is empty on most rows.
                        className={
                          order.identifier
                            ? "bg-status-warning/[0.06]"
                            : undefined
                        }
                      >
                        <TableCell
                          data-label={tl("order")}
                          data-area="number"
                          className="tabular-nums"
                        >
                          <RowLink
                            href={`/translations/${order.id}`}
                            className="inline-flex min-h-6 min-w-6 items-center hover:text-link font-medium transition-colors"
                          >
                            {order.number}
                          </RowLink>
                        </TableCell>

                        {/* The order's date over its due date. On a phone
                            the card has a Due cell of its own (below), so
                            the second line is left off there. */}
                        <TableCell
                          data-label={tl("date")}
                          data-area="date"
                          className="text-xs tabular-nums"
                        >
                          <span className="block">
                            <span className="sr-only">{tl("date")}: </span>
                            {formatDate(order.order_date)}
                          </span>
                          <span className="mt-0.5 block max-md:hidden">
                            <span className="sr-only">{tl("due")}: </span>
                            <DueDate
                              order={order}
                              overdueLabel={tl("overdueTip")}
                            />
                          </span>
                        </TableCell>

                        <TableCell
                          data-label={to("client")}
                          data-area="client"
                          data-full
                        >
                          <div className="flex items-start gap-2">
                            <RowLink
                              href={`/clients/${order.client_id}`}
                              title={order.client_name}
                              className="hover:text-link clamp-name font-medium transition-colors"
                            >
                              {order.client_name}
                            </RowLink>
                            <ClientTypeBadge clientType={order.client_type} />
                          </div>
                          {order.identifier && (
                            <span
                              title={to("identifier")}
                              className="border-status-warning/40 bg-status-warning/15 mt-1 inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium"
                            >
                              <Hash className="size-3 shrink-0" aria-hidden />
                              <span className="sr-only">
                                {to("identifier")}:{" "}
                              </span>
                              <span className="truncate">
                                {order.identifier}
                              </span>
                            </span>
                          )}
                          {order.language_pairs &&
                            order.language_pairs.length > 0 && (
                              // One pair per line, stacked, so two or more never
                              // spread across the row.
                              <ul className="text-muted-foreground mt-0.5 space-y-0.5 text-xs whitespace-normal">
                                {order.language_pairs.map((pair) => (
                                  <li key={pair}>
                                    {pair
                                      .split("→")
                                      .map((code) => languageName(code))
                                      .join(" → ")}
                                  </li>
                                ))}
                              </ul>
                            )}
                        </TableCell>

                        {showTranslators && (
                          <TableCell
                            data-label={to("translator")}
                            data-area="translator"
                            data-mobile-hidden={
                              order.translator_names?.length ? undefined : true
                            }
                            title={
                              order.translator_names?.join(", ") || undefined
                            }
                            className="text-muted-foreground max-w-36 truncate text-xs 2xl:max-w-52"
                          >
                            {order.translator_names?.length
                              ? order.translator_names.join(", ")
                              : "–"}
                          </TableCell>
                        )}

                        <TableCell data-label={tl("status")} data-area="status">
                          {canChangeStatus ? (
                            <InlineStatusSelect
                              orderId={order.id}
                              orderNumber={order.number}
                              current={order.status}
                              custom={reference.data?.custom_statuses}
                            />
                          ) : (
                            <StatusBadge status={order.status} />
                          )}
                        </TableCell>

                        <TableCell
                          data-label={tl("docsPages")}
                          data-mobile-hidden
                          className="text-right tabular-nums"
                        >
                          <span className="sr-only">{tl("docs")}: </span>
                          {order.document_count}
                          <span className="text-muted-foreground" aria-hidden>
                            {" "}
                            /{" "}
                          </span>
                          <span className="sr-only">, {tl("pagesCol")}: </span>
                          {order.page_count}
                        </TableCell>

                        <TableCell
                          data-label={tl("totalCol")}
                          data-area="total"
                          className="text-right"
                        >
                          <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                            {formatMoneyString(order.total)}
                            <PaidIcon state={order.paid_state} />
                          </span>
                        </TableCell>

                        {/* Behind reports.profit: operational staff see what a
                            client owes, not what the bureau makes. */}
                        {canSeeProfit && (
                          <TableCell
                            data-label={tl("profit")}
                            data-area="profit"
                            className="text-right tabular-nums lg:max-xl:hidden"
                          >
                            {formatMoneyString(order.profit)}
                          </TableCell>
                        )}

                        {/* The phone card's Due cell. From md up the due
                            date is the second line of the dates column, and
                            this cell (it has no header) is not rendered. */}
                        <TableCell
                          data-label={tl("due")}
                          data-area="due"
                          className="text-xs tabular-nums md:hidden"
                        >
                          <DueDate
                            order={order}
                            overdueLabel={tl("overdueTip")}
                          />
                        </TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaidLegend className="border-border border-t px-4 py-3" />

              <Pagination
                total={meta.total}
                limit={meta.limit}
                offset={meta.offset}
                basePath="/translations"
                params={current}
              />
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
