// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import type { Role } from "@office/features/users/api";
import type { Plan } from "@office/shared/auth/plans";
import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

/**
 * A role, as a pill.
 *
 * On the freelancer plan the owner is shown as "Freelancer": they are stored
 * as the owner of their own organisation, but "owner" of a one-person business
 * reads as an error to the person looking at it.
 */
export function RoleBadge({ role, plan }: { role: Role; plan?: Plan }) {
  const t = useTranslations("enums.role");
  const hue: Record<Role, Hue> = {
    superuser: "red",
    owner: "violet",
    admin: "blue",
    manager: "teal",
    staff: "grey",
  };
  const key = role === "owner" && plan === "freelancer" ? "freelancer" : role;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        // Grey for a role this build does not know yet, rather than a crash.
        HUE_CLASSES[hue[role] ?? "grey"].soft,
      )}
    >
      {t(key)}
    </span>
  );
}
