// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PayoutForm } from "@office/features/finances/components/payout-form";
import { listTranslators } from "@office/features/translators/api";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { todayIn } from "@office/shared/lib/dates";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("newPayout");

/** Pay a translator. `?translator=` preselects one, for the "Pay" buttons. */
export default async function NewPayoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ translator?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("finance.record_payment", locale);
  const t = await getTranslations("finances");
  const translatorId = Number((await searchParams).translator);

  // Inactive translators are listed too: someone who left is still owed for
  // the work they did before leaving.
  const translators = await tolerate(listTranslators({ limit: 200, sort: "name" }));

  return (
    <>
      <PageHeader
        {...sectionMark("finances")}
        title={t("newPayout.title")}
        description={t("newPayout.description")}
        actions={<BackLink href="/finances?tab=payables" label={t("backToFinances")} />}
      />
      {translators.data ? (
        <PayoutForm
          today={todayIn(session.timezone)}
          translators={translators.data.items.map((p) => ({ id: p.id, name: p.name }))}
          initialTranslatorId={
            Number.isInteger(translatorId) && translatorId > 0 ? translatorId : undefined
          }
        />
      ) : (
        <ApiUnavailable
          error={translators.error}
          what={t("form.translator")}
          endpoints={["GET /api/v1/translators"]}
        />
      )}
    </>
  );
}
