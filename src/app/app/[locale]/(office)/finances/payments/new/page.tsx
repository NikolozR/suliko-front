// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getClient } from "@office/features/clients/api";
import { PaymentForm } from "@office/features/finances/components/payment-form";
import type { PickedClient } from "@office/features/orders/components/client-picker";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { todayIn } from "@office/shared/lib/dates";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("newPayment");

/**
 * Record a client payment, allocated across orders.
 *
 * The PHP app's `bulk_payments.php`. One payment, N allocations — a client
 * settling six invoices with one transfer is the normal case, not the
 * exception, which is why this is the payment screen rather than a special one.
 * `?client=` preselects the client, for the button on a client's page.
 */
export default async function NewPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("finance.record_payment", locale);
  const t = await getTranslations("finances");

  const clientId = Number((await searchParams).client);
  let initialClient: PickedClient | null = null;
  if (Number.isInteger(clientId) && clientId > 0) {
    const found = await tolerate(getClient(clientId));
    if (found.data) {
      initialClient = {
        id: found.data.id,
        name: found.data.name,
        client_type: found.data.client_type,
      };
    }
  }

  return (
    <>
      <PageHeader
        {...sectionMark("finances")}
        title={t("newPayment.title")}
        description={t("newPayment.description")}
        actions={
          initialClient ? (
            <BackLink href={`/clients/${initialClient.id}`} label={initialClient.name} />
          ) : (
            <BackLink href="/finances?tab=payments" label={t("backToFinances")} />
          )
        }
      />
      <PaymentForm today={todayIn(session.timezone)} initialClient={initialClient} />
    </>
  );
}
