"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { leaveOrganisationAction } from "@office/shared/auth/actions";

import { AccountExitForm } from "./account-exit-form";

/** Close your own access to this organisation. Nothing is deleted. */
export function LeaveForm({
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
      action={leaveOrganisationAction}
      icon={<LogOut />}
      submitLabel={t("leaveSubmit")}
      idPrefix="leave"
      confirmWord={confirmWord}
      askPassword={askPassword}
    />
  );
}
