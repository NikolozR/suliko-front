// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  AlertTriangle, BarChart3, CalendarCheck, Circle, CircleCheck, FileText, Languages, Plus, Receipt, Settings, Tags,
  TrendingUp, UserPlus,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { getReference } from "@office/features/calculator/api";
import { StatCard, StatRow } from "@office/features/dashboard/components/stat-card";
import { StatusPipeline } from "@office/features/dashboard/components/status-pipeline";
import {
  FirstLanguagesDialog,
  OpenFirstLanguagesButton,
} from "@office/features/settings/components/first-languages-dialog";
import { listDocumentTypes } from "@office/features/settings/api";
import {
  DocumentTypesDialog,
  OpenDocumentTypesButton,
} from "@office/features/settings/components/document-types-dialog";
import { STARTING_RATE } from "@office/features/settings/starting-rate";
import { listOrders } from "@office/features/orders/api";
import { getInvoiceReadiness } from "@office/features/settings/companies";
import type { OrderPage } from "@office/features/orders/types";
import { getDashboard, type DashboardSummary, type StatusCount } from "@office/features/reports/api";
import { Link } from "@office/i18n/navigation";
import { Can } from "@office/shared/components/can";
import { requireSession } from "@office/shared/auth/guards";
import { ApiUnavailable, ApiUnavailableInline } from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { StatusBadge } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { OrderRowActions } from "@office/features/orders/components/order-row-actions";
import { ClickableRow } from "@office/shared/components/data/clickable-row";
import { RowLink } from "@office/shared/components/data/row-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { addDays, formatDate, isoDay, todayIn } from "@office/shared/lib/dates";
import { formatMoneyString, formatPercent } from "@office/shared/lib/money";
import { DASHBOARD_STATUS_EXCLUDED, DASHBOARD_STATUS_ORDER } from "@office/shared/lib/statuses";
import { tolerate, type Tolerated } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("dashboard");

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession(locale);
  const t = await getTranslations("dashboard");
  const tInvoice = await getTranslations("invoice");

  // Aggregates and the recent list are independent reads, so they go in
  // parallel. `reports.read` is in every role's bundle, so the cards are not
  // gated; the margin pills below are, via <Can>.
  //
  // Both are tolerated rather than awaited bare: this is the landing page
  // after login, and it must render something even when the API is behind
  // this build. A blank page with a digest here would look like the whole
  // product is down.
  // The recent list needs `orders.read`; asked for without it, it is a 403
  // that used to show as an error box on everyone's landing page.
  const canSeeOrders = session.permissions.includes("orders.read");
  const canEditOrders = session.permissions.includes("orders.write");
  const canSetPrices = session.permissions.includes("settings.manage");
  const [summaryResult, recentResult, reference, overdueResult, dueTodayResult, invoiceResult] =
    await Promise.all([
      tolerate(getDashboard()),
      canSeeOrders ? tolerate(listOrders({ sort: "-id", limit: 8 })) : null,
      canSetPrices ? tolerate(getReference()) : null,
      // What to work on today: the orders that went late most recently, then
      // today's. Newest-due first so that a pile of old ones cannot crowd the
      // week's out of the list (see `splitOverdue`).
      canSeeOrders ? tolerate(listOrders({ overdue: true, sort: "-due", limit: ATTENTION_ROWS })) : null,
      canSeeOrders ? tolerate(listOrders({ dueToday: true, sort: "-id", limit: ATTENTION_ROWS })) : null,
      // Whether invoices can be issued yet. Only an admin may read it.
      canSetPrices ? tolerate(getInvoiceReadiness()) : null,
    ]);

  // A new organisation has no prices, so it cannot quote or take an order —
  // and nothing else on this page says so. Say it here, where they land.
  const missing = reference?.data
    ? [
        reference.data.language_pairs.length === 0 && t("setup.pairs"),
        reference.data.document_types.length === 0 && t("setup.types"),
      ].filter((item): item is string => Boolean(item))
    : [];

  const summary = summaryResult.data;
  const canSeeProfit = session.permissions.includes("reports.profit");

  // The same banner as a checklist: the two price steps, then the first
  // order, and it stays until all three are ticked. "No orders yet" is only
  // claimed when a read positively says so: a failed one is not a to-do.
  const noOrders = recentResult?.data
    ? recentResult.data.meta.total === 0
    : summary
      ? summary.all_time.orders === 0
      : false;
  const setupSteps = reference?.data
    ? [
        { label: t("setup.steps.pairs"), done: reference.data.language_pairs.length > 0 },
        { label: t("setup.steps.types"), done: reference.data.document_types.length > 0 },
        { label: t("setup.steps.firstOrder"), done: !noOrders },
      ]
    : [];
  const setupOpen = setupSteps.some((step) => !step.done);

  // Overdue and due-today orders are what someone opens the dashboard to act
  // on, so when there are any the card goes above the figures. Empty (or
  // unreadable) it stays below them, where "nothing is late" is a footnote.
  //
  // Overdue is split by age: up to a week late is the day's work and is
  // listed; older than that is a backlog, one line with a link, so that
  // orders late since last year do not lead the list for ever.
  const attentionError = overdueResult?.error ?? dueTodayResult?.error;
  const { week: lateThisWeek, olderTotal } = splitOverdue(
    overdueResult?.data ?? null,
    session.timezone,
  );
  const attentionCount = lateThisWeek.length + (dueTodayResult?.data?.items.length ?? 0);
  const attentionFirst = !attentionError && attentionCount > 0;
  // Nothing late and nothing due today: one green line under the figures
  // says so. A whole card for it took 180px of a laptop screen.
  const allClear =
    Boolean(overdueResult && dueTodayResult) &&
    !attentionError &&
    attentionCount === 0 &&
    olderTotal === 0;
  const attention = overdueResult && dueTodayResult && !allClear && (
    <NeedsAttention
      t={t}
      overdue={overdueResult}
      lateThisWeek={lateThisWeek}
      olderTotal={olderTotal}
      dueToday={dueTodayResult}
      timeZone={session.timezone}
      canEdit={canEditOrders}
      className={attentionFirst ? "mb-6" : "mt-6"}
    />
  );
  const allClearStrip = allClear && (
    <p className="bg-hue-green-tint text-hue-green-ink mt-4 flex min-h-12 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      {t("attention.empty")}
    </p>
  );

  // Counts keyed by the stored status value, so the board below can render
  // the canonical order regardless of what the API happened to return.
  const counts = new Map(
    (summary?.by_status ?? []).map((row) => [row.status, row.count]),
  );
  const countOf = (status: string) => counts.get(status) ?? 0;

  // Anything the API reported that is not on the canonical board. Rendering
  // these rather than dropping them: a status nobody planned for still
  // represents real orders, and silently hiding them makes the totals wrong.
  const known = new Set([
    ...DASHBOARD_STATUS_ORDER,
    ...DASHBOARD_STATUS_EXCLUDED,
  ]);
  const unlisted = (summary?.by_status ?? []).filter(
    (row) => !known.has(row.status) && row.count > 0,
  );

  // A freelancer with no language pair yet is asked for one, right away: with
  // no price list there is nothing to quote or order from. Skippable, and
  // asked again at the next sign-in until one exists.
  const askLanguages =
    session.plan === "freelancer" &&
    canSetPrices &&
    reference?.data !== undefined &&
    reference.data !== null &&
    reference.data.language_pairs.length === 0;

  // Then, with a price list and no document type switched on, which kinds of
  // document they translate: one tick-list, everything ticked to begin with.
  const askTypes =
    session.plan === "freelancer" &&
    canSetPrices &&
    reference?.data !== undefined &&
    reference.data !== null &&
    reference.data.language_pairs.length > 0 &&
    reference.data.document_types.length === 0;
  const typeChoices = askTypes ? await tolerate(listDocumentTypes()) : null;
  const offerTypes = askTypes && Boolean(typeChoices?.data?.length);

  return (
    <>
      {offerTypes && typeChoices?.data && (
        <DocumentTypesDialog
          show
          types={typeChoices.data}
          labels={{
            title: t("typesPrompt.title"),
            body: t("typesPrompt.body"),
            selectAll: t("typesPrompt.selectAll"),
            clearAll: t("typesPrompt.clearAll"),
            count: t("typesPrompt.count", { count: "{count}" }),
            save: t("typesPrompt.save"),
            skip: t("typesPrompt.skip"),
          }}
        />
      )}
      {reference?.data && (
        <FirstLanguagesDialog
          show={askLanguages}
          languages={reference.data.languages}
          labels={{
            title: t("languagesPrompt.title"),
            body: t("languagesPrompt.body"),
            from: t("languagesPrompt.from"),
            to: t("languagesPrompt.to"),
            pick: t("languagesPrompt.pick"),
            rate: t("languagesPrompt.rate"),
            rateHint: t("languagesPrompt.rateHint", { rate: STARTING_RATE }),
            save: t("languagesPrompt.save"),
            skip: t("languagesPrompt.skip"),
          }}
        />
      )}
      <PageHeader
        {...sectionMark("dashboard")}
        title={t("title")}
        actions={
          <>
            <Can permission="orders.write">
              <Button variant="brand" size="sm" asChild>
                <Link href="/translations/new">
                  <Plus /> {t("newTranslation")}
                </Link>
              </Button>
            </Can>
            <Can permission="clients.write">
              <Button variant="outline" size="sm" asChild>
                <Link href="/clients/new">
                  <UserPlus /> {t("newClient")}
                </Link>
              </Button>
            </Can>
          </>
        }
      />

      {/* The warning the order page used to repeat on every order until the
          company was set up: here, once, where the setup is. The order page
          keeps it on the Invoice button. After the price setup above, which
          comes first. */}
      {!setupOpen && invoiceResult?.data?.ok === false && (
        <p className="border-hue-amber-ink/30 bg-hue-amber-tint mb-6 flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
          <AlertTriangle className="text-hue-amber-ink mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            {tInvoice("notReadyHint")}{" "}
            <Link
              href="/settings?tab=companies"
              className="text-link inline-flex min-h-6 items-center font-medium whitespace-nowrap hover:underline"
            >
              {tInvoice("notReadyAction")}
            </Link>
          </span>
        </p>
      )}

      {setupOpen && (
        <Card className="border-hue-amber-ink/30 bg-hue-amber-tint mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <Tags className="text-hue-amber-ink size-6 shrink-0" aria-hidden />
            {/* basis-56: without a basis the text may shrink to nothing, so on a
                phone the button stayed beside it and the words went one to a line. */}
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-medium">{t("setup.title")}</p>
              <p className="text-muted-foreground text-sm">
                {missing.length > 0
                  ? t("setup.body", { missing: missing.join(t("setup.join")) })
                  : t("setup.bodyFirstOrder")}
              </p>
              {/* A tick or an empty circle: the shape says which, not only
                  the colour, and a screen reader is told in words. */}
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                {setupSteps.map((step) => (
                  <li key={step.label} className="flex items-center gap-1.5">
                    {step.done ? (
                      <CircleCheck className="text-hue-green-ink size-4 shrink-0" aria-hidden />
                    ) : (
                      <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    )}
                    <span className={cn(!step.done && "font-medium")}>{step.label}</span>
                    <span className="sr-only">{step.done ? t("setup.done") : t("setup.todo")}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Prices first: without them there is nothing to make an order from. */}
            {missing.length > 0 ? (
              askLanguages ? (
                // The same short form as the sign-in prompt: two languages and a
                // rate. Settings -> Pricing opens on speeds and fees first.
                <OpenFirstLanguagesButton>
                  <Languages /> {t("setup.actionPair")}
                </OpenFirstLanguagesButton>
              ) : offerTypes ? (
                <OpenDocumentTypesButton>
                  <FileText /> {t("typesPrompt.action")}
                </OpenDocumentTypesButton>
              ) : (
                <Button variant="brand" size="sm" asChild>
                  <Link href="/settings?tab=pricing">
                    <Settings /> {t("setup.action")}
                  </Link>
                </Button>
              )
            ) : (
              <Can permission="orders.write">
                <Button variant="brand" size="sm" asChild>
                  <Link href="/translations/new">
                    <Plus /> {t("newTranslation")}
                  </Link>
                </Button>
              </Can>
            )}
          </CardContent>
        </Card>
      )}

      {attentionFirst && attention}

      {summaryResult.error ? (
        <ApiUnavailable
          error={summaryResult.error}
          what={t("what")}
          endpoints={["GET /api/v1/reports/dashboard"]}
        />
      ) : summary ? (
        <DashboardFigures
          t={t}
          summary={summary}
          canSeeProfit={canSeeProfit}
          countOf={countOf}
          unlisted={unlisted}
          belowCards={allClearStrip}
        />
      ) : null}

      {/* Without the figures there are no cards to sit under. */}
      {!summary && allClearStrip}
      {!attentionFirst && attention}

      {recentResult && (
        <RecentOrders
          t={t}
          result={recentResult}
          timeZone={session.timezone}
          canEdit={canEditOrders}
        />
      )}
    </>
  );
}

/**
 * The KPI cards and the status board.
 *
 * Split out so the page above reads as "figures, or an explanation of why
 * there are none" rather than burying that choice in nested ternaries.
 */
function DashboardFigures({
  t,
  summary,
  canSeeProfit,
  countOf,
  unlisted,
  belowCards,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"dashboard">>>;
  summary: DashboardSummary;
  canSeeProfit: boolean;
  countOf: (status: string) => number;
  unlisted: StatusCount[];
  /** Shown between the KPI cards and the status board. */
  belowCards?: ReactNode;
}) {
  const { this_month: month, all_time: allTime } = summary;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("allTime")}
          value={formatMoneyString(allTime.revenue)}
          icon={BarChart3}
          hue="amber"
          pill={
            canSeeProfit && allTime.margin !== null
              ? t("margin", { percent: formatPercent(allTime.margin) ?? "–" })
              : undefined
          }
        >
          {canSeeProfit && (
            <StatRow
              label={t("profit")}
              value={formatMoneyString(allTime.profit)}
            />
          )}
          <StatRow label={t("orders")} value={String(allTime.orders)} />
          <StatRow
            label={t("awaitingPayment")}
            sublabel={t("acrossOrders", {
              count: summary.awaiting_payment_orders,
            })}
            value={formatMoneyString(summary.awaiting_payment)}
            tone="danger"
          />
        </StatCard>

        <StatCard
          label={t("ordersThisMonth")}
          value={String(month.current.orders)}
          icon={CalendarCheck}
          hue="blue"
          delta={month.orders_change}
          deltaLabel={t("vsFirstDays", { days: month.days_elapsed })}
          footnote={t("lastMonthPartial", {
            partial: String(month.previous_partial.orders),
            days: month.days_elapsed,
            full: String(month.previous_full.orders),
          })}
        />

        <StatCard
          label={t("revenueThisMonth")}
          value={formatMoneyString(month.current.revenue)}
          icon={Receipt}
          hue="green"
          delta={month.revenue_change}
          deltaLabel={t("vsFirstDays", { days: month.days_elapsed })}
          footnote={t("lastMonthPartial", {
            partial: formatMoneyString(month.previous_partial.revenue),
            days: month.days_elapsed,
            full: formatMoneyString(month.previous_full.revenue),
          })}
        />

        {canSeeProfit && (
          <StatCard
            label={t("profitThisMonth")}
            value={formatMoneyString(month.current.profit)}
            icon={TrendingUp}
            hue="violet"
            delta={month.profit_change}
            deltaLabel={t("vsFirstDays", { days: month.days_elapsed })}
            pill={
              month.current.margin !== null
                ? t("margin", {
                    percent: formatPercent(month.current.margin) ?? "–",
                  })
                : undefined
            }
            footnote={
              month.previous_full.margin !== null
                ? t("marginLastMonth", {
                    percent: formatPercent(month.previous_full.margin) ?? "–",
                  })
                : undefined
            }
          />
        )}
      </div>

      {belowCards}

      <Card className="mt-6">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">{t("ordersByStatus")}</CardTitle>
            <span className="text-muted-foreground text-sm">
              · {t("stillOpen", { count: summary.open_orders })}
            </span>
            {summary.overdue_orders > 0 && (
              <span className="text-destructive text-sm font-medium">
                · {t("overdue", { count: summary.overdue_orders })}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* The six working statuses, all of them, always: see StatusPipeline. */}
          <StatusPipeline countOf={countOf} />

          {/* A bureau's own statuses, and older ones orders still carry
              (Paid…), count like any other — they have no step in the
              pipeline, so they sit under it, and only when they have orders. */}
          {unlisted.length > 0 && (
            <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {unlisted.map(({ status }) => (
                <RowLink
                  key={status}
                  href={`/translations?status=${encodeURIComponent(status)}`}
                  className="hover:bg-muted/60 -mx-2 flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
                >
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold tabular-nums">
                    {countOf(status)}
                  </span>
                </RowLink>
              ))}
            </div>
          )}

          {(() => {
            const excluded = DASHBOARD_STATUS_EXCLUDED.filter((status) => countOf(status) > 0);
            if (excluded.length === 0) return null;
            return (
              <div className="border-border mt-5 border-t pt-4">
                <p className="text-muted-foreground mb-3 text-xs">
                  {t("notCounted")}
                </p>
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                  {excluded.map((status) => (
                    <RowLink
                      key={status}
                      href={`/translations?status=${encodeURIComponent(status)}`}
                      className="hover:bg-muted/60 -mx-2 flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
                    >
                      <StatusBadge status={status} />
                      <span className="text-muted-foreground text-sm font-semibold tabular-nums">
                        {countOf(status)}
                      </span>
                    </RowLink>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </>
  );
}

const ATTENTION_ROWS = 6;

/** How many days late an order may be and still be this week's work. */
const LATE_WEEK = 7;

/**
 * The overdue orders in two ages: late by up to a week (listed), and later
 * than that (counted). `page` is newest-due first, so once one older order
 * has been read every one of the week's is already in hand and the rest of
 * the total is older; a page of nothing but the week's with more behind it
 * cannot say how many are older, and says nothing (the card's "All overdue"
 * button still counts them all).
 */
function splitOverdue(
  page: OrderPage | null,
  timeZone: string,
): { week: OrderPage["items"]; olderTotal: number } {
  if (!page) return { week: [], olderTotal: 0 };
  const since = addDays(todayIn(timeZone), -LATE_WEEK);
  const week = page.items.filter((order) => (isoDay(order.due_date, timeZone) ?? "") >= since);
  const sawOlder = week.length < page.items.length;
  const olderTotal = sawOlder || page.items.length === page.meta.total ? page.meta.total - week.length : 0;
  // Oldest first within the week: the one that has waited longest is the top row.
  return { week: week.reverse(), olderTotal };
}

/**
 * Overdue orders and those due today: the list someone opens the dashboard
 * to act on. The week's overdue first (the one waiting longest at the top),
 * then today's; orders more than a week late are one line under the list.
 * When there is nothing at all the page shows one green line instead of
 * this card ("nothing is late" is worth knowing, but not worth a card).
 */
function NeedsAttention({
  t,
  overdue,
  lateThisWeek,
  olderTotal,
  dueToday,
  timeZone,
  canEdit,
  className,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"dashboard">>>;
  overdue: Tolerated<OrderPage>;
  /** The overdue ones up to a week late, oldest first. */
  lateThisWeek: OrderPage["items"];
  /** How many are later than that. */
  olderTotal: number;
  dueToday: Tolerated<OrderPage>;
  timeZone: string;
  canEdit: boolean;
  /** The gap above or below, which depends on where the page puts the card. */
  className?: string;
}) {
  const error = overdue.error ?? dueToday.error;
  const todayItems = dueToday.data?.items ?? [];
  const overdueTotal = overdue.data?.meta.total ?? 0;
  const todayTotal = dueToday.data?.meta.total ?? 0;
  const rows = [
    ...lateThisWeek.map((order) => ({ order, late: true })),
    ...todayItems.map((order) => ({ order, late: false })),
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">{t("attention.title")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {overdueTotal > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/translations?quick=overdue">
                {t("attention.allOverdue", { count: overdueTotal })}
              </Link>
            </Button>
          )}
          {todayTotal > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/translations?quick=dueToday">
                {t("attention.allDueToday", { count: todayTotal })}
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-4">
            <ApiUnavailableInline error={error} what={t("attention.what")} />
          </div>
        ) : (
          <>
          {rows.length > 0 && (
          <div className="custom_scroll">
            <Table className="stack-mobile stack-brief">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("col.id")}</TableHead>
                  <TableHead>{t("col.client")}</TableHead>
                  <TableHead className="w-32">{t("col.due")}</TableHead>
                  <TableHead className="w-52">{t("col.status")}</TableHead>
                  <TableHead className="w-32 text-right">{t("col.total")}</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">{t("col.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ order, late }) => (
                  <ClickableRow
                    key={order.id}
                    href={`/translations/${order.id}`}
                    // Plain rows: the Due column says late (red, with an icon) or
                    // today (amber) in words.
                    className="hover:bg-muted/60"
                  >
                    <TableCell data-label={t("col.id")} data-area="id" className="text-muted-foreground tabular-nums">
                      <RowLink
                        href={`/translations/${order.id}`}
                        className="inline-flex min-h-6 min-w-6 items-center hover:text-link font-medium"
                      >
                        #{order.number}
                      </RowLink>
                    </TableCell>
                    <TableCell data-label={t("col.client")} data-area="client" data-full className="font-medium">
                      <span className="clamp-name" title={order.client_name}>{order.client_name}</span>
                    </TableCell>
                    <TableCell data-label={t("col.due")} data-area="when" className="text-sm tabular-nums">
                      {/* The hue inks, not text-destructive and
                          text-status-warning: on these row tints those
                          two fall to 4.1 and 4.5:1, the inks hold 4.9
                          and 5.3:1. */}
                      {late ? (
                        <span className="text-hue-red-ink inline-flex items-center gap-1 font-medium">
                          <AlertTriangle className="size-3.5" aria-hidden />
                          {formatDate(order.due_date, timeZone)}
                        </span>
                      ) : (
                        <span className="text-hue-amber-ink font-medium">
                          {t("attention.today")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell data-label={t("col.status")} data-area="status">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell data-label={t("col.total")} data-area="total" className="text-right font-medium tabular-nums">
                      {formatMoneyString(order.total)}
                    </TableCell>
                    {/* The whole row opens the order; the eye and pencil are left off a phone. */}
                    <TableCell data-full data-mobile-hidden>
                      <OrderRowActions
                        orderId={order.id}
                        viewLabel={t("openOrder", { number: order.number })}
                        editLabel={canEdit ? t("editOrder", { number: order.number }) : undefined}
                      />
                    </TableCell>
                  </ClickableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
          {/* The backlog: late by more than a week. One line, not rows. */}
          {olderTotal > 0 && (
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm",
                rows.length > 0 && "border-border border-t",
              )}
            >
              <span className="text-muted-foreground">{t("attention.older", { count: olderTotal })}</span>
              <Link
                href="/translations?quick=overdue&sort=due"
                className="text-link inline-flex min-h-6 items-center font-medium hover:underline"
              >
                {t("attention.olderAction")}
              </Link>
            </div>
          )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** The last few orders. A separate endpoint, so a separate failure. */
function RecentOrders({
  t,
  result,
  timeZone,
  canEdit,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"dashboard">>>;
  result: Tolerated<OrderPage>;
  timeZone: string;
  canEdit: boolean;
}) {
  const recent = result.data;

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{t("recentTranslations")}</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/translations">{t("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {result.error ? (
          <div className="p-4">
            <ApiUnavailableInline error={result.error} what={t("recentWhat")} />
          </div>
        ) : !recent || recent.items.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("noOrders")}</p>
        ) : (
          <div className="custom_scroll">
            <Table className="stack-mobile stack-brief">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("col.id")}</TableHead>
                  <TableHead>{t("col.client")}</TableHead>
                  <TableHead className="w-28">{t("col.date")}</TableHead>
                  <TableHead className="w-52">{t("col.status")}</TableHead>
                  <TableHead className="w-32 text-right">{t("col.total")}</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">{t("col.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.items.map((order) => (
                  <ClickableRow key={order.id} href={`/translations/${order.id}`}>
                    <TableCell data-label={t("col.id")} data-area="id" className="text-muted-foreground tabular-nums">
                      <RowLink
                        href={`/translations/${order.id}`}
                        className="inline-flex min-h-6 min-w-6 items-center hover:text-link font-medium"
                      >
                        #{order.number}
                      </RowLink>
                    </TableCell>
                    <TableCell data-label={t("col.client")} data-area="client" data-full className="font-medium">
                      <span className="clamp-name" title={order.client_name}>{order.client_name}</span>
                    </TableCell>
                    <TableCell data-label={t("col.date")} data-area="when" className="text-muted-foreground text-sm tabular-nums">
                      {formatDate(order.order_date, timeZone)}
                    </TableCell>
                    <TableCell data-label={t("col.status")} data-area="status">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell data-label={t("col.total")} data-area="total" className="text-right font-medium tabular-nums">
                      {formatMoneyString(order.total)}
                    </TableCell>
                    {/* The whole row opens the order; the eye and pencil are left off a phone. */}
                    <TableCell data-full data-mobile-hidden>
                      <OrderRowActions
                        orderId={order.id}
                        viewLabel={t("openOrder", { number: order.number })}
                        editLabel={canEdit ? t("editOrder", { number: order.number }) : undefined}
                      />
                    </TableCell>
                  </ClickableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
