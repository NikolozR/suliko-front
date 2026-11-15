// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, CalendarX, Settings } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MonthlyInvoiceDocument } from "@office/features/clients/components/monthly-invoice-document";
import { Link } from "@office/i18n/navigation";
import { getMonthlyInvoice } from "@office/features/settings/companies";
import { missingInvoiceFields } from "@office/features/settings/invoice-problems";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { clientNumberOf, pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle(
  "monthlyInvoice",
  clientNumberOf,
  "clients",
);

/**
 * A client's invoice for one month (`?month=2026-10`). The invoice language is
 * chosen with `?locale=`, independent of the interface, as on an order's
 * invoice.
 */
export default async function MonthlyInvoicePage({
  params,
  searchParams,
}: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = await requirePermission("orders.read", locale);

  if (!/^\d{1,10}$/.test(id)) notFound();
  const clientId = Number(id);
  const t = await getTranslations("invoice");
  const tm = await getTranslations("clients.monthly");

  const query = await searchParams;
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const month = one("month");
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    redirect(`/${locale}/clients/${clientId}`);
  }
  const invoiceLocale = one("locale") === "en" ? "en" : "ka";

  const header = (
    <PageHeader
      {...sectionMark("clients")}
      title={tm("title")}
      actions={
        <BackLink href={`/clients/${clientId}`} label={t("backToClient")} />
      }
    />
  );

  let invoice;
  try {
    invoice = await getMonthlyInvoice(clientId, month, invoiceLocale);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      if (error.status === 409) {
        const missing = missingInvoiceFields(error.detail, t);
        return (
          <>
            {header}
            <Card className="border-status-warning/40 bg-status-warning/[0.06]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <AlertTriangle
                  className="text-status-warning size-8"
                  aria-hidden
                />
                <p className="font-medium">{t("cannotIssue")}</p>
                <p className="text-muted-foreground max-w-lg text-sm">
                  {missing
                    ? t("missingFields", { fields: missing.join(", ") })
                    : error.detail}
                </p>
                {!session.permissions.includes("settings.manage") && (
                  <p className="text-muted-foreground max-w-lg text-sm">
                    {t("askAdmin")}
                  </p>
                )}
                <Can permission="settings.manage">
                  <Button variant="brand" size="sm" asChild>
                    <Link href="/settings?tab=companies">
                      <Settings /> {t("openCompanies")}
                    </Link>
                  </Button>
                </Can>
              </CardContent>
            </Card>
          </>
        );
      }
    }
    throw error;
  }

  if (invoice.order_count === 0) {
    return (
      <>
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <CalendarX className="text-muted-foreground size-8" aria-hidden />
            <p className="font-medium">{tm("empty")}</p>
            <p className="text-muted-foreground max-w-lg text-sm">
              {tm("emptyHint")}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return <MonthlyInvoiceDocument invoice={invoice} clientId={clientId} />;
}
