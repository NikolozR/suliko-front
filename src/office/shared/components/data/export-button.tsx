// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@office/shared/components/ui/button";
import { withBasePath } from "@office/shared/lib/base-path";

/**
 * "Export (Excel)" for a list screen: the current filters, as a CSV Excel
 * opens with Georgian intact. A plain link to withBasePath(`/api/export/<resource>`) — the
 * route handler streams the file with the session attached, and the browser
 * saves it. Column headers follow the interface language.
 */
export function ExportButton({
  resource,
  params = {},
}: {
  resource: "orders" | "clients" | "payments" | "expenses";
  /** The list's current filters; empty values are dropped. */
  params?: Record<string, string | undefined>;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const query = new URLSearchParams(
    Object.entries({ ...params, lang: locale }).filter(
      (entry): entry is [string, string] => Boolean(entry[1]),
    ),
  );

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={withBasePath(`/api/export/${resource}?${query}`)} download>
        <Download /> <span className="max-sm:sr-only">{t("exportCsv")}</span>
      </a>
    </Button>
  );
}
