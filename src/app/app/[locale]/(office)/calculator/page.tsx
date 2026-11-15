// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { Calculator } from "@office/features/calculator/components/calculator";
import { requireSession } from "@office/shared/auth/guards";
import { ErrorState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("calculator");

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tc = await getTranslations("calculator");
  const session = await requireSession(locale);

  // Caught rather than thrown: the calculator is useless without reference
  // data, and "Settings has no language pairs yet" is a setup problem with a
  // clear fix, not a crash.
  let reference;
  try {
    reference = await getReference();
  } catch {
    return (
      <>
        <PageHeader {...sectionMark("calculator")} title={t("calculator")} />
        <Card>
          <CardContent className="p-0">
            <ErrorState message={tc("loadFailed")} />
          </CardContent>
        </Card>
      </>
    );
  }

  if (reference.language_pairs.length === 0) {
    return (
      <>
        <PageHeader {...sectionMark("calculator")} title={t("calculator")} />
        <Card>
          <CardContent className="p-0">
            <ErrorState message={tc("noPairs")} />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        {...sectionMark("calculator")}
        title={t("calculator")}
        description={tc("description")}
      />
      <Calculator
        reference={reference}
        canCreateOrders={session.permissions.includes("orders.write")}
        canSeeCosts={session.permissions.includes("reports.profit")}
      />
    </>
  );
}
