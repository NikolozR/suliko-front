// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations } from "next-intl/server";

import { daysSince, userState, type UserState } from "@office/features/users/status";
import { cn } from "@office/shared/lib/utils";

const TONE: Record<UserState, string> = {
  off: "text-muted-foreground",
  // Both still need something from the person, so neither is green.
  invited: "text-status-warning",
  not_signed_in: "text-status-warning",
  signed_in: "text-status-success",
};

/**
 * Where this person is: invited, accepted but never signed in, active, or off.
 *
 * Someone who has not got in yet also says how long ago they were invited, so
 * an invitation that has been sitting for a week reads differently from one sent
 * this morning.
 */
export async function UserStateBadge({
  user,
  className,
}: {
  user: { is_active: boolean; invitation_pending?: boolean; last_login_at: string | null; created_at: string };
  className?: string;
}) {
  const t = await getTranslations("users");
  const state = userState(user);
  const waiting = state === "invited" || state === "not_signed_in";

  const label: Record<UserState, string> = {
    off: t("disabled"),
    invited: t("invited"),
    not_signed_in: t("stateNotSignedIn"),
    signed_in: t("active"),
  };

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className={cn("text-xs font-medium", TONE[state])}>{label[state]}</span>
      {waiting && (
        <span className="text-muted-foreground text-xs">
          {t("stateAge", { count: daysSince(user.created_at) })}
        </span>
      )}
    </div>
  );
}
