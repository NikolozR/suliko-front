"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { MailPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { ResendInvitation } from "@office/features/users/components/resend-invitation";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@office/shared/components/ui/dialog";

/**
 * "Send the invitation again" from the Users list, for someone who has not got
 * in. It opens the same card the member's page has, in a dialog, rather than
 * sending on one click: the new link is shown once, and a dialog is the place
 * to show it. The person's name is in the header so a click on the wrong row
 * is noticed before anything is sent.
 */
export function ResendFromList({
  userId,
  name,
  accepted,
}: {
  userId: number;
  name: string;
  accepted: boolean;
}) {
  const t = useTranslations("users");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("resendInvitation")}: ${name}`}>
          <MailPlus />
        </Button>
      </DialogTrigger>
      {/* Clicks inside a dialog bubble through React to the row behind it,
          which would open the member's page: `data-row-ignore` stops that. */}
      <DialogContent data-row-ignore>
        <DialogHeader>
          <DialogTitle>{t("resendInvitation")}</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ResendInvitation userId={userId} accepted={accepted} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
