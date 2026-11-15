// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Mail, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getBillingOverview } from "@office/features/billing/api";
import { UpgradePackage } from "@office/features/billing/components/upgrade-package";
import { monthLabel, usedPercent } from "@office/features/billing/lib";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { formatMoneyString } from "@office/shared/lib/money";
import { pageTitle } from "@office/shared/lib/page-title";
import { tolerate } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";

export const generateMetadata = pageTitle("billing");

/** Where an offer is asked for. The same address suliko.ge uses. */
const SALES_EMAIL = "info@suliko.ge";

/**
 * Billing, for the owner.
 *
 * Which package the account is on, how many of its orders this month have been
 * used, the packages it can move up to, and the invoices that have been asked for.
 * When all the package's orders are used, new orders are refused until the owner
 * moves up: a button, a short summary of the terms, one confirmation, and it
 * changes at once. An invoice is the package's monthly fee, paid by bank transfer
 * and marked paid by hand when the money arrives.
 */
export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("tenant.billing", locale);
  const t = await getTranslations("billing");
  const tNav = await getTranslations("nav");
  const overview = await tolerate(getBillingOverview());

  const usage = overview.data?.usage;
  const packages = overview.data?.packages ?? [];
  const invoices = overview.data?.invoices ?? [];
  // Invoices and free months are one list of months, newest first.
  const invoicedPeriods = new Set(invoices.map((invoice) => invoice.period));
  const months = [
    ...invoices.map((invoice) => ({ period: invoice.period, invoice })),
    ...(overview.data?.free_months ?? [])
      .filter((period) => !invoicedPeriods.has(period))
      .map((period) => ({ period, invoice: null })),
  ].sort((a, b) => b.period.localeCompare(a.period));
  const upgradeTo = new Set(overview.data?.upgrade_to ?? []);
  const termsVersion = overview.data?.terms_version ?? "";
  const percent = usage ? usedPercent(usage.orders, usage.included) : 0;
  const priceText = (price: string | null) =>
    price === null
      ? t("contactUs")
      : Number(price) === 0
        ? t("free")
        : t("perMonth", { price: formatMoneyString(price) });

  return (
    <>
      <PageHeader {...sectionMark("billing")} title={tNav("billing")} description={t("subtitle")} />

      {overview.error && (
        <div className="mb-6">
          <ApiUnavailable
            error={overview.error}
            what={t("unavailable")}
            endpoints={["GET /api/v1/billing"]}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("planTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList>
              <Detail label={t("organisation")} value={session.tenantName ?? session.tenantSlug} />
              <Detail
                label={t("plan")}
                value={session.plan === "freelancer" ? t("planFreelancer") : t("planBureau")}
              />
              {usage && (
                <Detail label={t("package")} value={t("packageValue", { tier: usage.tier })} />
              )}
            </DetailList>

            {usage && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("usageTitle", { month: monthLabel(usage.period, locale) })}
                  </h3>
                  <span className="text-lg font-semibold tabular-nums">
                    {t("usageFigure", { orders: usage.orders, included: usage.included })}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={usage.included}
                  aria-valuenow={Math.min(usage.orders, usage.included)}
                  className="bg-muted h-2 overflow-hidden rounded-full"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      usage.level === "ok" && "bg-status-success",
                      usage.level === "near" && "bg-status-warning",
                      usage.level === "limit" && "bg-destructive",
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {usage.level !== "ok" && (
                  <p
                    className={cn(
                      "text-sm",
                      usage.level === "near" ? "text-status-warning" : "text-destructive",
                    )}
                  >
                    {usage.blocked
                      ? upgradeTo.size > 0
                        ? t("levelLimit")
                        : t("levelLimitTop")
                      : t("levelNear", { remaining: usage.remaining })}
                  </p>
                )}
                {usage.free_month && (
                  <p role="status" className="text-status-success text-sm font-medium">
                    {t("freeMonth")}
                  </p>
                )}
                <DetailList>
                  <Detail
                    label={t("fee")}
                    value={usage.free_month ? t("freeThisMonth") : priceText(usage.monthly_price)}
                  />
                </DetailList>
                <p className="text-muted-foreground text-xs">{t("usageNote")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {usage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("pricingTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{t("pricingBody")}</p>
              <ul className="divide-border border-border divide-y rounded-md border text-sm">
                {packages.map((pack) => (
                  <li key={pack.tier} className="space-y-2 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">
                          {t("upTo", { count: pack.orders_included })}
                        </span>
                        {pack.tier === usage.tier && (
                          <span className="text-muted-foreground block text-xs">
                            {t("yourPackage")}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-right",
                          pack.monthly_price !== null
                            ? "font-semibold tabular-nums"
                            : "text-muted-foreground",
                        )}
                      >
                        {priceText(pack.monthly_price)}
                      </span>
                    </div>
                    {upgradeTo.has(pack.tier) && (
                      <UpgradePackage
                        pack={pack}
                        termsVersion={termsVersion}
                        highlight={usage.blocked && pack.tier === Math.min(...upgradeTo)}
                      />
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">{t("onlySuliko")}</p>
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(t("emailSubject"))}`}>
                  <Mail /> {t("contactButton")}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {usage && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("invoicesTitle")}</CardTitle>
              <p className="text-muted-foreground text-sm">{t("invoicesBody")}</p>
            </CardHeader>
            <CardContent className="p-0">
              {months.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-6 text-sm">{t("noInvoices")}</p>
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("col.month")}</TableHead>
                        <TableHead className="w-32 text-right">{t("col.orders")}</TableHead>
                        <TableHead className="w-32 text-right">{t("col.total")}</TableHead>
                        <TableHead className="w-44">{t("col.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {months.map(({ period, invoice }) =>
                        invoice ? (
                          <TableRow key={invoice.id}>
                            <TableCell data-full className="font-medium">
                              {monthLabel(invoice.period, locale)}
                              {invoice.note && (
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {invoice.note}
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              data-label={t("col.orders")}
                              className="text-right tabular-nums"
                            >
                              {invoice.orders_counted} / {invoice.orders_included}
                            </TableCell>
                            <TableCell
                              data-label={t("col.total")}
                              className="text-right font-medium tabular-nums"
                            >
                              {formatMoneyString(invoice.total)}
                            </TableCell>
                            <TableCell data-label={t("col.status")} className="text-sm">
                              <span
                                className={cn(
                                  invoice.status === "paid" && "text-status-success",
                                  invoice.status === "sent" && "text-status-warning",
                                  invoice.status === "waived" && "text-muted-foreground",
                                )}
                              >
                                {t(`status.${invoice.status}`)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={`free-${period}`}>
                            <TableCell data-full className="font-medium">
                              {monthLabel(period, locale)}
                            </TableCell>
                            <TableCell
                              data-label={t("col.orders")}
                              className="text-muted-foreground text-right"
                            >
                              –
                            </TableCell>
                            <TableCell
                              data-label={t("col.total")}
                              className="text-right font-medium tabular-nums"
                            >
                              {formatMoneyString("0.00")}
                            </TableCell>
                            <TableCell data-label={t("col.status")} className="text-sm">
                              <span className="text-status-success">{t("status.free")}</span>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-muted-foreground px-6 py-4 text-xs">{t("howToPay")}</p>
            </CardContent>
          </Card>
        )}

        {/* A free first month is a bureau's offer, not a freelancer's. */}
        {session.plan !== "freelancer" && (
          <Card className="lg:col-span-2">
            <CardContent className="flex items-start gap-3 pt-6">
              <ShieldCheck className="text-status-success mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <h2 className="font-semibold">{t("trialTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("trialBody")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
