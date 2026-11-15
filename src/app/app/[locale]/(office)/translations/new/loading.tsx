// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { FormPageSkeleton } from "@office/shared/components/data/page-skeletons";

export default function Loading() {
  const t = useTranslations("orders");
  return <FormPageSkeleton section="translations" title={t("newTitle")} sidebar />;
}
