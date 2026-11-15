"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { requestAccountDeletionAction } from "@office/shared/auth/actions";

import { AccountExitForm } from "./account-exit-form";

/**
 * Ask for the whole account to be deleted. A request, not the deletion: the team
 * reviews it, and the account is closed to its owner meanwhile.
 */
export function DeleteAccountForm({
  confirmWord,
  askPassword,
}: {
  /** What has to be typed before the button works: the person's own username. */
  confirmWord: string;
  /** False when the password is suliko.ge's and there is none to ask for. */
  askPassword: boolean;
}) {
  const t = useTranslations("auth");

  return (
    <AccountExitForm
      action={requestAccountDeletionAction}
      icon={<Trash2 />}
      submitLabel={t("deleteSubmit")}
      idPrefix="delete"
      confirmWord={confirmWord}
      askPassword={askPassword}
    />
  );
}
