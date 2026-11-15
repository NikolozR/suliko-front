// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { monthLabel, shiftMonth } from "@office/features/billing/lib";
import { getPlatformBilling } from "@office/features/platform/api";
import { InvoiceControls } from "@office/features/platform/components/invoice-controls";
import { PackageEditor } from "@office/features/platform/components/package-editor";
import { PrepareInvoicesForm } from "@office/features/platform/components/prepare-invoices-form";
import { Link } from "@office/i18n/navigation";
import { requireAdmin } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
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

export const generateMetadata = pageTitle("platform");

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Order packages and invoices, for a superuser.
 *
 * The three packages every bureau is priced by (how many orders a month the fee
 * covers, the fee, what each order beyond that costs), and for one month every
 * bureau's orders against its package. Invoices are worked out here for a
 * month that has ended, asked of the bureau by bank transfer outside the app,
 * and marked sent and paid by hand.
 */
export default async function PlatformBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale } = await params;
  const { period: requested } = await searchParams;
  setRequestLocale(locale);

  await requireAdmin(locale, "/admin/billing");
  const t = await getTranslations("platform.billing");
  const period = requested && PERIOD.test(requested) ? requested : undefined;
  const billing = await tolerate(getPlatformBilling(period));
  const data = billing.data;

  return (
    <>
      <PageHeader
        {...sectionMark("admin")}
        title={t("title")}
        description={t("description")}
        actions={<BackLink href="/admin" label={t("back")} />}
      />

      {billing.error && (
        <ApiUnavailable
          error={billing.error}
          what={t("what")}
          endpoints={["GET /api/v1/platform/billing"]}
        />
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("packagesTitle")}</CardTitle>
              <p className="text-muted-foreground text-sm">{t("packagesNote")}</p>
            </CardHeader>
            <CardContent>
              <PackageEditor packages={data.packages} />
            </CardContent>
          </Card>

          <Card className="mt-6 overflow-hidden">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">
                {t("monthTitle", { month: monthLabel(data.period, locale) })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/billing?period=${shiftMonth(data.period, -1)}`}>
                    <ChevronLeft /> {t("previous")}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/billing?period=${shiftMonth(data.period, 1)}`}>
                    {t("next")} <ChevronRight />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.accounts.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">{t("none")}</p>
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("col.organisation")}</TableHead>
                        <TableHead className="w-24">{t("col.package")}</TableHead>
                        <TableHead className="w-28 text-right">{t("col.orders")}</TableHead>
                        <TableHead className="w-28 text-right">{t("col.toPay")}</TableHead>
                        <TableHead>{t("col.invoice")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.accounts.map((bureau) => (
                        <TableRow key={bureau.tenant_id}>
                          <TableCell data-full className="font-medium">
                            <Link
                              href={`/admin/tenants/${bureau.tenant_id}`}
                              className="hover:text-link transition-colors"
                            >
                              {bureau.name}
                            </Link>
                            <span className="text-muted-foreground block font-mono text-xs font-normal">
                              {bureau.slug}
                            </span>
                          </TableCell>
                          <TableCell data-label={t("col.package")} className="tabular-nums">
                            {bureau.usage.tier}
                            <span className="text-muted-foreground block text-xs">
                              {t(`audience.${bureau.audience}`)}
                            </span>
                          </TableCell>
                          <TableCell
                            data-label={t("col.orders")}
                            className={cn(
                              "text-right tabular-nums",
                              bureau.usage.level === "near" && "text-status-warning",
                              bureau.usage.level === "limit" && "text-destructive",
                            )}
                          >
                            {bureau.usage.orders} / {bureau.usage.included}
                          </TableCell>
                          <TableCell
                            data-label={t("col.toPay")}
                            className="text-right font-medium tabular-nums"
                          >
                            {formatMoneyString(bureau.invoice?.total ?? bureau.usage.monthly_price)}
                          </TableCell>
                          <TableCell data-full>
                            {bureau.invoice ? (
                              <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">
                                  {t("invoiceTotal", {
                                    total: formatMoneyString(bureau.invoice.total),
                                  })}
                                </span>
                                <InvoiceControls invoice={bureau.invoice} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                {t("noInvoice")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="border-border border-t p-4">
                <PrepareInvoicesForm
                  period={data.period}
                  monthName={monthLabel(data.period, locale)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
