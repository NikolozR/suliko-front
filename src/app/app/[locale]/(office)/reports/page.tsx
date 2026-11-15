// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StatCard } from "@office/features/dashboard/components/stat-card";
import { getReportSummary } from "@office/features/reports/api";
import {
  ComparisonBars,
  CostDonut,
  MonthlyTrendChart,
} from "@office/features/reports/components/charts";
import {
  PeriodPicker,
  resolvePeriod,
  type PeriodKey,
} from "@office/features/reports/components/period-picker";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { todayIn } from "@office/shared/lib/dates";
import { formatMoneyString, formatPercent, toChartNumber } from "@office/shared/lib/money";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("reports");

export default async function ReportsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // `reports.profit`, not `reports.read`: this screen shows margins and
  // per-supplier cost, which staff are not meant to see. Hiding the nav item
  // would not stop a bookmarked URL.
  const session = await requirePermission("reports.profit", locale);

  const t = await getTranslations("nav");
  const tr = await getTranslations("reports");
  const te = await getTranslations("enums.clientType");
  const query = await searchParams;
  const raw = Array.isArray(query.period) ? query.period[0] : query.period;

  const today = todayIn(session.timezone);
  const period = resolvePeriod(raw, today);
  const result = await tolerate(
    getReportSummary({ start: period.start, end: period.end, months: period.months }),
  );

  // The period picker still renders when the data does not, so someone can
  // change the range and retry without going back to the dashboard.
  if (!result.data) {
    return (
      <>
        <PageHeader
          {...sectionMark("reports")}
          title={t("reports")}
          description={tr("description")}
        />
        <div className="mb-6">
          <PeriodPicker active={period.key as PeriodKey} today={today} />
        </div>
        <ApiUnavailable
          error={result.error}
          what={tr("what")}
          endpoints={["GET /api/v1/reports/summary"]}
        />
      </>
    );
  }

  const summary = result.data;
  const { period: totals, cost_breakdown: costs, by_client_type: byType } = summary;

  // The courier fee is not a cost: it is collected and passed straight on.
  const costTotal =
    toChartNumber(costs.translator) + toChartNumber(costs.notary) + toChartNumber(costs.expenses);

  return (
    <>
      <PageHeader
        {...sectionMark("reports")}
        title={t("reports")}
        description={tr("descriptionLong")}
      />

      <div className="mb-6">
        <PeriodPicker active={period.key as PeriodKey} today={today} />
        <p className="text-muted-foreground mt-2 text-xs">
          {period.start ? `${period.start} → ${period.end}` : tr("allTime")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* The dashboard's card, in the dashboard's colours for the same
            figures: revenue green, profit violet. */}
        <StatCard
          label={tr("revenue")}
          value={formatMoneyString(totals.revenue)}
          footnote={tr("ordersCount", { count: totals.orders })}
          icon={BarChart3}
          hue="green"
        />
        <StatCard
          label={tr("profit")}
          value={formatMoneyString(totals.profit)}
          footnote={
            totals.margin === null
              ? tr("noMargin")
              : tr("margin", { percent: formatPercent(totals.margin) ?? "–" })
          }
          icon={TrendingUp}
          hue="violet"
        />
        <StatCard
          label={tr("totalCost")}
          value={formatMoneyString(costTotal.toFixed(2))}
          footnote={tr("totalCostHint")}
          icon={PieChart}
          hue="red"
        />
        <StatCard
          label={tr("averageOrder")}
          value={
            totals.orders
              ? formatMoneyString((toChartNumber(totals.revenue) / totals.orders).toFixed(2))
              : "–"
          }
          footnote={tr("averageHint")}
          icon={Users}
          hue="blue"
        />
      </div>

      {summary.delivery_collected && summary.delivery_collected !== "0.00" && (
        <p className="text-muted-foreground mt-3 text-xs">
          <span className="text-foreground font-medium">{tr("deliveryCollected")}:</span>{" "}
          {formatMoneyString(summary.delivery_collected)}. {tr("deliveryHint")}
        </p>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{tr("trendTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {tr("trendBody", { months: period.months })}
          </p>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart points={summary.monthly_trends} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr("costTitle")}</CardTitle>
            <p className="text-muted-foreground text-sm">{tr("costBody")}</p>
          </CardHeader>
          <CardContent>
            <CostDonut
              slices={[
                // Each cost in its module's colour, as in the sidebar.
                { label: tr("translators"), value: costs.translator, hue: "violet" },
                { label: tr("notaries"), value: costs.notary, hue: "plum" },
                { label: tr("otherExpenses"), value: costs.expenses, hue: "grey" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr("byTypeTitle")}</CardTitle>
            <p className="text-muted-foreground text-sm">{tr("byTypeBody")}</p>
          </CardHeader>
          <CardContent>
            <ComparisonBars
              rows={byType.map((row) => ({
                label: te(row.client_type),
                // As the B2B and B2C pills are everywhere else.
                hue: row.client_type === "B2B" ? "violet" : "teal",
                revenue: row.revenue,
                profit: row.profit,
                orders: row.orders,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="text-muted-foreground p-4 text-sm">
          <span className="text-foreground font-medium">{tr("howTitle")}:</span>{" "}
          {tr("howBody")}
        </CardContent>
      </Card>
    </>
  );
}
