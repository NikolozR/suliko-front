// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";

/**
 * The "back" affordance in a page header.
 *
 * An explicit destination rather than `router.back()`: a form reached from a
 * search-results page, a deep link or a browser refresh has no useful history
 * entry, and "back" that lands somewhere unrelated is worse than no button.
 * Every caller names where up is — usually the list, or the record an edit
 * form belongs to.
 *
 * Rendered ghost and first in the header's actions, so it never competes with
 * the primary action on the right.
 */
export function BackLink({
  href,
  label,
}: {
  href: ComponentProps<typeof Link>["href"];
  /** Say what it goes back TO wherever the header alone does not make it obvious. */
  label?: string;
}) {
  const t = useTranslations("common");
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>
        <ArrowLeft /> {label ?? t("back")}
      </Link>
    </Button>
  );
}
