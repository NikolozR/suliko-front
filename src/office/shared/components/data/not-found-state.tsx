// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { FileQuestion, LayoutDashboard, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";

/**
 * A page or a record that is not there, shown inside the app shell.
 *
 * It used to be Next's default black page, in English only, with no way back
 * (audit F16). Now the sidebar stays, the words say what probably happened,
 * and two buttons lead somewhere that works.
 */
export function NotFoundState() {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <FileQuestion className="text-muted-foreground size-10" aria-hidden />
      <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground text-sm">{t("notFoundBody")}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="brand" size="sm" asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> {tCommon("goToDashboard")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/translations">
            <ListOrdered /> {t("notFoundOrders")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
