// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations } from "next-intl/server";

import { monthLabel } from "@office/features/billing/lib";
import type { TenantBilling } from "@office/features/platform/api";
import { FreeMonthButton } from "@office/features/platform/components/free-month-control";
import { InvoiceControls } from "@office/features/platform/components/invoice-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@office/shared/components/ui/table";
import { formatMoneyString } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";

/**
 * Every month of one account from the day it began, newest first: its orders against
 * the package, what the month costs, and where it stands. A month with an invoice
 * is followed by hand right here (open, sent, paid, waived); a month without one can
 * be made free, or have its free mark taken back.
 */
export async function TenantMonths({
  tenantId,
  months,
  locale,
}: {
  tenantId: number;
  months: TenantBilling["months"];
  locale: string;
}) {
  const t = await getTranslations("platform.billing");

  return (
    <div className="custom_scroll">
      <Table className="stack-mobile">
        <TableHeader>
          <TableRow>
            <TableHead>{t("col.month")}</TableHead>
            <TableHead className="w-28 text-right">{t("col.orders")}</TableHead>
            <TableHead className="w-28 text-right">{t("col.toPay")}</TableHead>
            <TableHead className="w-44">{t("col.state")}</TableHead>
            <TableHead>{t("col.invoice")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month.period}>
              <TableCell data-full className="font-medium">
                {monthLabel(month.period, locale)}
              </TableCell>
              <TableCell data-label={t("col.orders")} className="text-right tabular-nums">
                {month.orders} / {month.included}
              </TableCell>
              <TableCell data-label={t("col.toPay")} className="text-right tabular-nums">
                {month.fee === null ? (
                  <span className="text-muted-foreground">{t("noPrice")}</span>
                ) : (
                  formatMoneyString(month.fee)
                )}
              </TableCell>
              <TableCell data-label={t("col.state")} className="text-sm">
                <span
                  className={cn(
                    month.state === "free" && "text-status-success font-medium",
                    month.state === "paid" && "text-status-success",
                    month.state === "sent" && "text-status-warning",
                    (month.state === "waived" ||
                      month.state === "current" ||
                      month.state === "not_invoiced") &&
                      "text-muted-foreground",
                  )}
                >
                  {month.state === "free" ||
                  month.state === "current" ||
                  month.state === "not_invoiced"
                    ? t(`monthState.${month.state}`)
                    : t(`status.${month.state}`)}
                </span>
              </TableCell>
              <TableCell data-label={t("col.invoice")}>
                {month.invoice ? (
                  <InvoiceControls invoice={month.invoice} />
                ) : (
                  <FreeMonthButton tenantId={tenantId} period={month.period} free={month.free} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
