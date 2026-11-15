"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { MailPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useMemo } from "react";

import { resendInvitationAction, type InviteFormState } from "@office/features/users/actions";
import { InviteSent } from "@office/features/users/components/invite-form";
import { guardedAction } from "@office/features/users/guarded-action";
import { FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { useTimezone } from "@office/shared/components/timezone-context";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { formatDateTime } from "@office/shared/lib/dates";

/**
 * A new invitation link for someone who has not got in yet.
 *
 * The first link is shown once and lasts a week, and inviting the same person
 * again is refused, so without this a lost email meant deleting them and
 * starting over. The old link stops working the moment this one is made.
 *
 * `accepted` is someone who clicked accept but has not signed in: usually they
 * registered on suliko.ge under a different sign-in (a phone number), which the
 * invitation, made for an address, never matches.
 */
export function ResendInvitation({
  userId,
  accepted,
  count = 0,
  lastSentAt = null,
}: {
  userId: number;
  accepted: boolean;
  /** Links sent so far and when the last went out: only the member's own page knows. */
  count?: number;
  lastSentAt?: string | null;
}) {
  const t = useTranslations("users");
  const timeZone = useTimezone();
  // A failure of the call itself (the host cutting it short, a dropped
  // connection) becomes a message here, not the error page: the email may well
  // have gone out, and the person should look before pressing again.
  const action = useMemo(() => guardedAction(resendInvitationAction, t("callFailed")), [t]);
  const [state, formAction] = useActionState<InviteFormState, FormData>(action, {});

  if (state.invited) return <InviteSent invited={state.invited} resent />;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{t("invitationCardTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={userId} />
          <p className="text-sm">{accepted ? t("invitationAccepted") : t("invitationOpen")}</p>
          {count > 0 && lastSentAt && (
            <p className="text-muted-foreground text-xs">
              {t("invitationHistory", { count, date: formatDateTime(lastSentAt, timeZone) })}
            </p>
          )}
          <FormAlert message={state.error} stepUp={state.stepUp} />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton label={t("resendInvitation")} icon={<MailPlus />} variant="outline" />
            <p className="text-muted-foreground text-xs">{t("resendInvitationHint")}</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
