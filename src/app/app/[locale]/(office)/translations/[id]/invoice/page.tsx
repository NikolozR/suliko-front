// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { InvoiceDocument } from "@office/features/orders/components/invoice-document";
import { getOrderInvoice } from "@office/features/settings/companies";
import { missingInvoiceFields } from "@office/features/settings/invoice-problems";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { orderNumberOf, pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("invoice", orderNumberOf, "orders");

/**
 * An order's invoice, ready to print.
 *
 * The invoice language is chosen with `?locale=`, independently of the UI
 * language: staff work in Georgian and routinely send an English invoice to a
 * foreign client. Tying it to the interface would make that impossible
 * without switching the whole app.
 */
export default async function OrderInvoicePage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("orders.read", locale);

  if (!/^\d{1,10}$/.test(id)) notFound();
  const orderId = Number(id);
  const t = await getTranslations("invoice");

  const query = await searchParams;
  const raw = Array.isArray(query.locale) ? query.locale[0] : query.locale;
  const invoiceLocale = raw === "en" ? "en" : "ka";

  let invoice;
  try {
    invoice = await getOrderInvoice(orderId, invoiceLocale);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();

      // 409: the company is incomplete. That is a settings problem with a
      // known fix, not a failure — so it gets the fix, not an error page.
      if (error.status === 409) {
        // The API names raw columns ("missing name_ka, id_number"); say
        // which details they are, in the reader's language.
        const missing = missingInvoiceFields(error.detail, t);
        // Named by its number in the bureau, as everywhere; the id is only
        // for the link back.
        const number = await orderNumberOf(orderId).catch(() => null);
        return (
          <>
            <PageHeader
              {...sectionMark("translations")}
              title={number === null ? t("titlePlain") : t("title", { id: number })}
              actions={<BackLink href={`/translations/${orderId}`} label={t("backToOrder")} />}
            />
            <Card className="border-status-warning/40 bg-status-warning/[0.06]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <AlertTriangle className="text-status-warning size-8" aria-hidden />
                <p className="font-medium">{t("cannotIssue")}</p>
                <p className="text-muted-foreground max-w-lg text-sm">
                  {missing ? t("missingFields", { fields: missing.join(", ") }) : error.detail}
                </p>
                {!session.permissions.includes("settings.manage") && (
                  <p className="text-muted-foreground max-w-lg text-sm">{t("askAdmin")}</p>
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

  return <InvoiceDocument invoice={invoice} />;
}
