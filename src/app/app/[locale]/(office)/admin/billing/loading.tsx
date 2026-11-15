// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { ListPageSkeleton } from "@office/shared/components/data/page-skeletons";

export default function Loading() {
  const t = useTranslations("platform.billing");
  return <ListPageSkeleton section="admin" title={t("title")} columns={6} filters={0} filterCard />;
}
