// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  AlertCircle, ArrowDownLeft, ArrowUpRight, HandCoins, HelpCircle, Plus, Receipt, Scale, Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  deleteExpenseAction,
  deleteNotaryPayoutAction,
  deletePaymentAction,
  deleteTranslatorPayoutAction,
} from "@office/features/finances/actions";
import {
  getOverview,
  listExpenses,
  listNotaryBalances,
  listNotaryPayouts,
  listPayables,
  listPayments,
  listReceivables,
  listTranslatorPayouts,
} from "@office/features/finances/api";
import {
  PeriodPicker,
  resolvePeriod,
  type PeriodKey,
} from "@office/features/reports/components/period-picker";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { ActionError } from "@office/shared/components/data/action-error";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { ExportButton } from "@office/shared/components/data/export-button";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { TabsContent, TabsList, TabsTrigger } from "@office/shared/components/ui/tabs";
import { UrlTabs } from "@office/shared/components/url-tabs";
import { RowLink } from "@office/shared/components/data/row-link";
import { sectionMark } from "@office/shared/config/navigation";
import { formatDate, todayIn } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import { tolerate } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const TABS = ["receivables", "payables", "notaries", "payments", "payouts", "expenses"] as const;
type Tab = (typeof TABS)[number];
const TOP = 10;

/** Negative amounts are the point of this screen, so they are coloured. */
function Amount({ value, signed = false }: { value: string; signed?: boolean }) {
  const negative = value.trimStart().startsWith("-");
  return (
    <span
      className={cn(
        "tabular-nums",
        signed && (negative ? "text-destructive" : "text-status-success"),
      )}
    >
      {formatMoneyString(value)}
    </span>
  );
}

function BalanceCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Wallet;
  tone?: "default" | "owed" | "owing";
}) {
  return (
    // py-0: the Card's own 24px on top of the content's 20px put 44px of air
    // above every label (the dashboard's StatCard does the same); on a phone
    // each of these cards was about 175px tall. Two to a row on a phone now,
    // so a smaller figure and a tighter pad there.
    <Card className="py-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* Body font, not the caps display one: long Georgian labels wrapped to three lines in it. */}
          <div
            role="heading"
            aria-level={2}
            // Two lines tall whether the label takes one or two, so the figures
            // below line up across the cards.
            className="text-muted-foreground text-sm font-medium xl:min-h-10"
          >
            {label}
          </div>
          <Icon className="text-muted-foreground/60 size-4 shrink-0" aria-hidden />
        </div>
        <p
          className={cn(
            "mt-2 text-lg font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-2xl",
            tone === "owed" && "text-status-success",
            tone === "owing" && "text-destructive",
          )}
        >
          {formatMoneyString(value)}
        </p>
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyRow({ span, message }: { span: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={span} data-full className="text-muted-foreground py-8 text-center text-sm">
        {message}
      </TableCell>
    </TableRow>
  );
}

/** "#12, #15" — each a link to the order, named by its number in the bureau. */
function OrderLinks({
  orders,
}: {
  orders: { order_id: number | null; order_number?: number | null }[];
}) {
  const unique = [
    ...new Map(
      orders
        .filter((o): o is { order_id: number; order_number?: number | null } => o.order_id !== null)
        .map((o) => [o.order_id, o.order_number ?? null] as const),
    ),
  ];
  if (unique.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <>
      {unique.map(([id, number], index) => (
        <span key={id}>
          {index > 0 && ", "}
          <RowLink href={`/translations/${id}`} className="inline-flex min-h-6 min-w-6 items-center hover:text-link tabular-nums">
            {number === null ? "#" : `#${number}`}
          </RowLink>
        </span>
      ))}
    </>
  );
}

export const generateMetadata = pageTitle("finances");

export default async function FinancesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("finance.read", locale);
  const canRefund = session.permissions.includes("finance.refund");
  const canExpenses = session.permissions.includes("finance.expenses");
  // A freelancer records what clients paid and what a notary cost, and that
  // is all: there is no translator to owe, and their plan keeps no expense
  // ledger. Their screen leaves those parts out instead of showing four
  // tables that can only ever be empty. A bureau sees everything, as before
  // (someone there who may read but not add expenses still reads them).
  const hasTranslators = session.permissions.includes("translators.read");
  const showExpenses = canExpenses || session.plan !== "freelancer";
  const tabs = TABS.filter(
    (name) =>
      (hasTranslators || name !== "payables") && (showExpenses || name !== "expenses"),
  );

  const t = await getTranslations("nav");
  const tf = await getTranslations("finances");
  const tm = await getTranslations("enums.paymentMethod");
  const tx = await getTranslations("enums.expenseCategory");
  const query = await searchParams;
  const today = todayIn(session.timezone);
  const period = resolvePeriod(one(query.period), today);
  const rawTab = one(query.tab) ?? "";
  const tab: Tab = tabs.includes(rawTab as Tab) ? (rawTab as Tab) : "receivables";
  const actionError = one(query.error);

  // Independent reads, so they go in parallel rather than in series.
  const [
    overviewResult,
    receivablesR,
    payablesR,
    notariesR,
    expensesR,
    paymentsR,
    translatorPayoutsR,
    notaryPayoutsR,
  ] = await Promise.all([
    tolerate(getOverview({ start: period.start, end: period.end })),
    tolerate(listReceivables(TOP)),
    hasTranslators ? tolerate(listPayables(TOP)) : null,
    tolerate(listNotaryBalances(TOP)),
    showExpenses
      ? tolerate(listExpenses({ start: period.start, end: period.end, limit: 20 }))
      : null,
    tolerate(listPayments({ start: period.start, end: period.end, limit: 20 })),
    hasTranslators ? tolerate(listTranslatorPayouts({ limit: 20 })) : null,
    tolerate(listNotaryPayouts({ limit: 20 })),
  ]);

  // The overview drives every card and both totals, so without it there is no
  // screen. The tables below degrade to empty lists individually.
  if (!overviewResult.data) {
    return (
      <>
        <PageHeader
          {...sectionMark("finances")}
          title={t("finances")}
          description={tf("description")}
        />
        <ApiUnavailable
          error={overviewResult.error}
          what={tf("what")}
          endpoints={["GET /api/v1/finances/overview"]}
        />
      </>
    );
  }

  const overview = overviewResult.data;
  const receivables = receivablesR.data ?? [];
  const payables = payablesR?.data ?? [];
  const notaries = notariesR.data ?? [];
  const emptyLedger = { items: [], meta: { total: 0, limit: 20, offset: 0 }, total_amount: "0.00" };
  const expenses = expensesR?.data ?? emptyLedger;
  const payments = paymentsR.data ?? emptyLedger;
  const translatorPayouts = translatorPayoutsR?.data ?? [];
  const notaryPayouts = notaryPayoutsR.data ?? [];

  const { period: flow } = overview;
  const returnTo = (tabName: Tab) =>
    `/finances?${new URLSearchParams({ tab: tabName, period: period.key })}`;
  const methodLabel = (method: string) => (tm.has(method) ? tm(method) : method);
  const date = (value: string | null) => formatDate(value, session.timezone);

  return (
    <>
      <PageHeader
        {...sectionMark("finances")}
        title={t("finances")}
        description={tf("description")}
        actions={
          <>
            <Can permission="finance.expenses">
              <Button variant="outline" size="sm" asChild>
                <Link href="/finances/expenses/new">
                  <Receipt /> {tf("addExpense")}
                </Link>
              </Button>
            </Can>
            <Can permission="finance.record_payment">
              {hasTranslators && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/finances/payouts/new">
                    <HandCoins /> {tf("payTranslator")}
                  </Link>
                </Button>
              )}
              <Button variant="brand" size="sm" asChild>
                <Link href="/finances/payments/new">
                  <Plus /> {tf("recordPayment")}
                </Link>
              </Button>
            </Can>
          </>
        }
      />

      <ActionError message={actionError} />

      <div className="mb-6">
        <PeriodPicker
          active={period.key as PeriodKey}
          today={today}
          basePath="/finances"
          query={{ tab }}
        />
        <p className="text-muted-foreground mt-2 text-xs">
          {period.start ? `${period.start} → ${period.end}` : tf("allTime")}
          {" · "}
          <span>{tf("balancesNote")}</span>
        </p>
      </div>

      <div
        className={cn(
          // Two to a row from the phone up, the odd last card across both, so
          // five cards are three rows, not five. From xl they are one row.
          "grid grid-cols-2 gap-3 sm:gap-4 [&>:last-child:nth-child(odd)]:col-span-2 xl:[&>:last-child:nth-child(odd)]:col-span-1",
          hasTranslators ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        <BalanceCard
          label={tf("cards.receivables")}
          value={overview.receivables}
          hint={tf("cards.receivablesHint", { count: overview.receivable_clients })}
          icon={ArrowDownLeft}
          tone="owed"
        />
        {hasTranslators && (
          <BalanceCard
            label={tf("cards.translators")}
            value={overview.payables_translators}
            hint={tf("cards.translatorsHint")}
            icon={ArrowUpRight}
            tone="owing"
          />
        )}
        <BalanceCard
          label={tf("cards.notaries")}
          value={overview.payables_notaries}
          hint={tf("cards.notariesHint")}
          icon={ArrowUpRight}
          tone="owing"
        />
        <BalanceCard
          label={tf("cards.unattributed")}
          value={overview.unattributed_notary_fees}
          hint={tf("cards.unattributedHint")}
          icon={HelpCircle}
        />
        <BalanceCard
          label={tf("cards.net")}
          value={overview.net_outstanding}
          hint={tf("cards.netHint")}
          icon={Scale}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{tf("flow.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["paymentsReceived", flow.payments_received],
                ["translatorPayouts", flow.translator_payouts],
                ["notaryPayouts", flow.notary_payouts],
                ["expenses", flow.expenses],
              ] as const
            )
              .filter(
                ([key]) =>
                  (hasTranslators || key !== "translatorPayouts") &&
                  (showExpenses || key !== "expenses"),
              )
              .map(([key, value]) => (
              <div key={key} className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium">{tf(`flow.${key}`)}</dt>
                <dd className="text-sm font-semibold">{formatMoneyString(value)}</dd>
              </div>
            ))}
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium">{tf("flow.net")}</dt>
              <dd className="text-sm font-semibold">
                <Amount value={flow.net} signed />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <UrlTabs value={tab} className="mt-6">
        <TabsList className="flex-wrap">
          {tabs.map((name) => (
            <TabsTrigger key={name} value={name}>
              {tf(`tabs.${name}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="receivables" className="mt-4">
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tf("col.client")}</TableHead>
                      <TableHead className="w-20 text-right">{tf("col.orders")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.billed")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.paid")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.outstanding")}</TableHead>
                      <TableHead className="w-28">{tf("col.oldestUnpaid")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.length === 0 ? (
                      <EmptyRow span={6} message={tf("noReceivables")} />
                    ) : (
                      receivables.map((row) => (
                        <TableRow key={row.client_id}>
                          <TableCell data-label={tf("col.client")} data-full className="font-medium">
                            <RowLink
                              href={`/clients/${row.client_id}`}
                              title={row.client_name}
                              className="hover:text-link clamp-name"
                            >
                              {row.client_name}
                            </RowLink>
                          </TableCell>
                          <TableCell data-label={tf("col.orders")} className="text-right tabular-nums">{row.orders}</TableCell>
                          <TableCell data-label={tf("col.billed")} className="text-right">
                            <Amount value={row.billed} />
                          </TableCell>
                          <TableCell data-label={tf("col.paid")} className="text-right">
                            <Amount value={row.paid} />
                          </TableCell>
                          <TableCell data-label={tf("col.outstanding")} className="text-right font-semibold">
                            <Amount value={row.outstanding} />
                          </TableCell>
                          <TableCell data-label={tf("col.oldestUnpaid")} className="text-muted-foreground text-xs">
                            {date(row.oldest_unpaid)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-xs">
            {receivables.length >= TOP && `${tf("topNote", { count: TOP })} `}
            {tf("receivablesNote")}
          </p>
        </TabsContent>

        {hasTranslators && (
          <TabsContent value="payables" className="mt-4">
            <Card className="overflow-hidden py-0">
              <CardContent className="p-0">
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tf("col.translator")}</TableHead>
                        <TableHead className="w-32 text-right">{tf("col.earned")}</TableHead>
                        <TableHead className="w-32 text-right">{tf("col.paid")}</TableHead>
                        <TableHead className="w-32 text-right">{tf("col.owed")}</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payables.length === 0 ? (
                        <EmptyRow span={5} message={tf("noPayables")} />
                      ) : (
                        payables.map((row) => (
                          <TableRow key={row.translator_id}>
                            <TableCell data-label={tf("col.translator")} data-full className="font-medium">
                              <RowLink
                                href={`/translators/${row.translator_id}`}
                                title={row.translator_name}
                                className="hover:text-link clamp-name"
                              >
                                {row.translator_name}
                              </RowLink>
                            </TableCell>
                            <TableCell data-label={tf("col.earned")} className="text-right">
                              <Amount value={row.earned} />
                            </TableCell>
                            <TableCell data-label={tf("col.paid")} className="text-right">
                              <Amount value={row.paid} />
                            </TableCell>
                            <TableCell data-label={tf("col.owed")} className="text-right font-semibold">
                              <Amount value={row.outstanding} />
                            </TableCell>
                            <TableCell data-full className="text-right">
                              <Can permission="finance.record_payment">
                                <Button variant="outline" size="sm" asChild>
                                  <RowLink href={`/finances/payouts/new?translator=${row.translator_id}`}>
                                    {tf("pay")}
                                  </RowLink>
                                </Button>
                              </Can>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            {payables.length >= TOP && (
              <p className="text-muted-foreground mt-2 text-xs">{tf("topNote", { count: TOP })}</p>
            )}
          </TabsContent>
        )}

        <TabsContent value="notaries" className="mt-4">
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tf("col.notary")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.earned")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.paid")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.owed")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notaries.length === 0 ? (
                      <EmptyRow span={4} message={tf("noNotaries")} />
                    ) : (
                      notaries.map((row) => (
                        <TableRow key={row.notary_id}>
                          <TableCell data-label={tf("col.notary")} data-full className="font-medium">
                            <RowLink
                              href={`/notaries/${row.notary_id}`}
                              title={row.notary_name}
                              className="hover:text-link clamp-name"
                            >
                              {row.notary_name}
                            </RowLink>
                          </TableCell>
                          <TableCell data-label={tf("col.earned")} className="text-right">
                            <Amount value={row.earned} />
                          </TableCell>
                          <TableCell data-label={tf("col.paid")} className="text-right">
                            <Amount value={row.paid} />
                          </TableCell>
                          <TableCell data-label={tf("col.owed")} className="text-right font-semibold">
                            <Amount value={row.outstanding} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <div className="border-status-warning/40 bg-status-warning/10 mt-3 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
            <AlertCircle className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              {tf("unattributedNote", {
                amount: formatMoneyString(overview.unattributed_notary_fees),
              })}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{tf("paymentsTitle")}</h2>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm tabular-nums">
                  {tf("countAndTotal", {
                    count: payments.meta.total,
                    total: formatMoneyString(payments.total_amount),
                  })}
                </span>
                <ExportButton
                  resource="payments"
                  params={{ start: period.start, end: period.end }}
                />
              </div>
            </div>
            <CardContent className="p-0">
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">{tf("col.date")}</TableHead>
                      <TableHead>{tf("col.client")}</TableHead>
                      <TableHead className="w-32">{tf("col.method")}</TableHead>
                      <TableHead>{tf("col.orders")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.amount")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.unallocated")}</TableHead>
                      {canRefund && <TableHead className="w-12" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.items.length === 0 ? (
                      <EmptyRow span={canRefund ? 7 : 6} message={tf("noPayments")} />
                    ) : (
                      payments.items.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell data-label={tf("col.date")} className="text-muted-foreground text-sm tabular-nums">
                            {date(row.payment_date)}
                          </TableCell>
                          <TableCell data-label={tf("col.client")} data-full className="font-medium">
                            <RowLink
                              href={`/clients/${row.client_id}`}
                              title={row.client_name ?? tf("clientN", { id: row.client_id })}
                              className="hover:text-link clamp-name"
                            >
                              {row.client_name ?? tf("clientN", { id: row.client_id })}
                            </RowLink>
                            {row.notes && (
                              <p className="text-muted-foreground text-xs font-normal">{row.notes}</p>
                            )}
                          </TableCell>
                          <TableCell data-label={tf("col.method")} className="text-muted-foreground text-sm">
                            {methodLabel(row.method)}
                          </TableCell>
                          <TableCell data-label={tf("col.orders")} className="text-xs">
                            <OrderLinks orders={row.allocations} />
                          </TableCell>
                          <TableCell data-label={tf("col.amount")} className="text-right font-semibold">
                            <Amount value={row.amount} />
                          </TableCell>
                          <TableCell data-label={tf("col.unallocated")} className="text-right">
                            {row.unallocated === "0.00" ? (
                              <span className="text-muted-foreground text-xs">–</span>
                            ) : (
                              <span className="text-status-warning text-sm font-medium tabular-nums">
                                {formatMoneyString(row.unallocated)}
                              </span>
                            )}
                          </TableCell>
                          {canRefund && (
                            <TableCell data-full className="text-right">
                              <ConfirmDeleteButton
                                compact
                                id={row.id}
                                name={tf("delete.payment", { id: row.id })}
                                description={tf("delete.description")}
                                action={deletePaymentAction}
                                fields={{ return_to: returnTo("payments") }}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-xs">{tf("paymentsNote")}</p>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4 space-y-4">
          {hasTranslators && (
            <Card className="overflow-hidden py-0">
              <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{tf("translatorPayoutsTitle")}</h2>
                <span className="text-muted-foreground text-xs">{tf("latestNote")}</span>
              </div>
              <CardContent className="p-0">
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">{tf("col.date")}</TableHead>
                        <TableHead>{tf("col.translator")}</TableHead>
                        <TableHead className="w-32">{tf("col.method")}</TableHead>
                        <TableHead>{tf("col.orders")}</TableHead>
                        <TableHead className="w-32 text-right">{tf("col.amount")}</TableHead>
                        {canRefund && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {translatorPayouts.length === 0 ? (
                        <EmptyRow span={canRefund ? 6 : 5} message={tf("noTranslatorPayouts")} />
                      ) : (
                        translatorPayouts.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell data-label={tf("col.date")} className="text-muted-foreground text-sm tabular-nums">
                              {date(row.payment_date)}
                            </TableCell>
                            <TableCell data-label={tf("col.translator")} data-full className="font-medium">
                              <RowLink
                                href={`/translators/${row.translator_id}`}
                                title={row.translator_name ?? `#${row.translator_id}`}
                                className="hover:text-link clamp-name"
                              >
                                {row.translator_name ?? `#${row.translator_id}`}
                              </RowLink>
                              {row.notes && (
                                <p className="text-muted-foreground text-xs font-normal">{row.notes}</p>
                              )}
                            </TableCell>
                            <TableCell data-label={tf("col.method")} className="text-muted-foreground text-sm">
                              {methodLabel(row.method)}
                            </TableCell>
                            <TableCell data-label={tf("col.orders")} className="text-xs">
                              <OrderLinks orders={row.allocations} />
                            </TableCell>
                            <TableCell data-label={tf("col.amount")} className="text-right font-semibold">
                              <Amount value={row.amount} />
                            </TableCell>
                            {canRefund && (
                              <TableCell data-full className="text-right">
                                <ConfirmDeleteButton
                                  compact
                                  id={row.id}
                                  name={tf("delete.payout", { id: row.id })}
                                  description={tf("delete.description")}
                                  action={deleteTranslatorPayoutAction}
                                  fields={{ return_to: returnTo("payouts") }}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{tf("notaryPayoutsTitle")}</h2>
              <span className="text-muted-foreground text-xs">{tf("latestNote")}</span>
            </div>
            <CardContent className="p-0">
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">{tf("col.date")}</TableHead>
                      <TableHead>{tf("col.notary")}</TableHead>
                      <TableHead className="w-32">{tf("col.method")}</TableHead>
                      <TableHead>{tf("col.orders")}</TableHead>
                      <TableHead className="w-32 text-right">{tf("col.amount")}</TableHead>
                      {canRefund && <TableHead className="w-12" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notaryPayouts.length === 0 ? (
                      <EmptyRow span={canRefund ? 6 : 5} message={tf("noNotaryPayouts")} />
                    ) : (
                      notaryPayouts.map((row) => {
                        const names = [
                          ...new Set(row.allocations.map((a) => a.notary_name).filter(Boolean)),
                        ];
                        return (
                          <TableRow key={row.id}>
                            <TableCell data-label={tf("col.date")} className="text-muted-foreground text-sm tabular-nums">
                              {date(row.payment_date)}
                            </TableCell>
                            <TableCell data-label={tf("col.notary")} data-full className="font-medium">
                              {names.length ? names.join(", ") : "–"}
                              {row.paid_via_translator_payment_id && (
                                <p className="text-muted-foreground text-xs font-normal">
                                  {tf("viaTranslator", { id: row.paid_via_translator_payment_id })}
                                </p>
                              )}
                            </TableCell>
                            <TableCell data-label={tf("col.method")} className="text-muted-foreground text-sm">
                              {methodLabel(row.method)}
                            </TableCell>
                            <TableCell data-label={tf("col.orders")} className="text-xs">
                              <OrderLinks orders={row.allocations} />
                            </TableCell>
                            <TableCell data-label={tf("col.amount")} className="text-right font-semibold">
                              <Amount value={row.amount} />
                            </TableCell>
                            {canRefund && (
                              <TableCell data-full className="text-right">
                                <ConfirmDeleteButton
                                  compact
                                  id={row.id}
                                  name={tf("delete.payout", { id: row.id })}
                                  description={tf("delete.description")}
                                  action={deleteNotaryPayoutAction}
                                  fields={{ return_to: returnTo("payouts") }}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showExpenses && (
          <TabsContent value="expenses" className="mt-4">
            <Card className="overflow-hidden py-0">
              <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{tf("expensesTitle")}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {tf("countAndTotal", {
                      count: expenses.meta.total,
                      total: formatMoneyString(expenses.total_amount),
                    })}
                  </span>
                  <ExportButton
                    resource="expenses"
                    params={{ start: period.start, end: period.end }}
                  />
                </div>
              </div>
              <CardContent className="p-0">
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">{tf("col.date")}</TableHead>
                        <TableHead className="w-36">{tf("col.category")}</TableHead>
                        <TableHead>{tf("col.description")}</TableHead>
                        <TableHead className="w-24">{tf("col.order")}</TableHead>
                        <TableHead className="w-32 text-right">{tf("col.amount")}</TableHead>
                        {canExpenses && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.items.length === 0 ? (
                        <EmptyRow span={canExpenses ? 6 : 5} message={tf("noExpenses")} />
                      ) : (
                        expenses.items.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell data-label={tf("col.date")} className="text-muted-foreground text-sm tabular-nums">
                              {date(row.expense_date)}
                            </TableCell>
                            <TableCell data-label={tf("col.category")} className="text-sm">
                              {tx.has(row.category) ? tx(row.category) : row.category}
                            </TableCell>
                            <TableCell data-label={tf("col.description")} data-full className="font-medium">{row.description}</TableCell>
                            <TableCell data-label={tf("col.order")} className="text-sm">
                              {row.order_id ? (
                                <OrderLinks orders={[row]} />
                              ) : (
                                <span className="text-muted-foreground text-xs">{tf("general")}</span>
                              )}
                            </TableCell>
                            <TableCell data-label={tf("col.amount")} className="text-right font-semibold">
                              <Amount value={row.amount} />
                            </TableCell>
                            {canExpenses && (
                              <TableCell data-full className="text-right">
                                <ConfirmDeleteButton
                                  compact
                                  id={row.id}
                                  name={tf("delete.expense", { id: row.id })}
                                  description={tf("delete.description")}
                                  action={deleteExpenseAction}
                                  fields={{ return_to: returnTo("expenses") }}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </UrlTabs>
    </>
  );
}
