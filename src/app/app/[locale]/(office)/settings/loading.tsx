// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { TabbedPageSkeleton } from "@office/shared/components/data/page-skeletons";

export default function Loading() {
  const t = useTranslations("settings");
  return <TabbedPageSkeleton section="settings" title={t("title")} />;
}
