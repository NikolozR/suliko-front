"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { revokeSuperuserAction, type PlatformFormState } from "@office/features/platform/actions";
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
 * Take someone's platform access away.
 *
 * Confirmed first: it removes their superuser membership on the spot and
 * signs them out of it. Their account, and any other organisation they belong
 * to, is left alone. The row disappears from the list when it succeeds.
 */
export function RevokeSuperuserButton({ userId, name }: { userId: number; name: string }) {
  const t = useTranslations("platform.superusers");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    revokeSuperuserAction,
    {},
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldOff /> {t("remove")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={ShieldOff} hue="red">
          <DialogTitle>{t("remove")}</DialogTitle>
          <DialogDescription>{t("removeConfirm", { name })}</DialogDescription>
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
            <SubmitButton label={t("remove")} icon={<ShieldOff />} variant="destructive" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
