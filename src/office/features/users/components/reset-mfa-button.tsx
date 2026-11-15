"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { resetUserMfaAction, type UserFormState } from "@office/features/users/actions";
import { FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";

/**
 * Remove someone's second factor — the lost-phone case.
 *
 * Confirmed first: it is as consequential as a password reset for an account
 * protected by both, and the API applies the same rank guard to it.
 */
export function ResetMfaButton({ userId, name }: { userId: number; name: string }) {
  const t = useTranslations("auth.mfa");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<UserFormState, FormData>(resetUserMfaAction, {});

  if (state.ok) {
    return (
      <p className="text-status-success flex items-center gap-1.5 text-sm">
        <Check className="size-4" aria-hidden /> {t("resetForUserDone")}
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldOff /> {t("resetForUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={ShieldOff} hue="red">
          <DialogTitle>{t("resetForUser")}</DialogTitle>
          <DialogDescription>{t("resetForUserConfirm", { name })}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className={dialogFormClass}>
          <input type="hidden" name="id" value={userId} />
          {state.error && (
            <div className="px-5 sm:px-6">
              <FormAlert message={state.error} stepUp={state.stepUp} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton label={t("resetForUser")} icon={<ShieldOff />} variant="destructive" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
