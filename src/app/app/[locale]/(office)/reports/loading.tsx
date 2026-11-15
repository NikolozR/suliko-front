// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { DashboardSkeleton } from "@office/shared/components/data/page-skeletons";

export default function Loading() {
  const t = useTranslations("nav");
  return <DashboardSkeleton section="reports" title={t("reports")} />;
}
