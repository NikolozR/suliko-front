"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import {
  approveDeletionAction,
  rejectDeletionAction,
  type PlatformFormState,
} from "@office/features/platform/actions";
import { Field, FormAlert, SubmitButton } from "@office/shared/components/form/fields";
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
import { Textarea } from "@office/shared/components/ui/textarea";

/**
 * What a reviewer can do with one request.
 *
 * Waiting: approve it (which starts the 30 days) or reject it. Approved: only
 * cancel it, which is the same rejection. Approving is not offered while an
 * organisation would be left without an owner, and when the findings show
 * anything else the reviewer has to say they looked before the button works.
 */
export function DeletionReviewActions({
  id,
  name,
  approved,
  blocked,
  hasFindings,
}: {
  id: number;
  name: string;
  /** Already confirmed: waiting out the 30 days. */
  approved: boolean;
  /** An organisation would be left without an owner. */
  blocked: boolean;
  /** Anything to look at, blocking or not. */
  hasFindings: boolean;
}) {
  const t = useTranslations("platform.deletion");

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {!approved && (
        <ApproveDialog id={id} name={name} blocked={blocked} hasFindings={hasFindings} />
      )}
      <RejectDialog id={id} name={name} approved={approved} />
      {blocked && !approved && (
        <p className="text-muted-foreground basis-full text-right text-xs">{t("blockedHint")}</p>
      )}
    </div>
  );
}

function ApproveDialog({
  id,
  name,
  blocked,
  hasFindings,
}: {
  id: number;
  name: string;
  blocked: boolean;
  hasFindings: boolean;
}) {
  const t = useTranslations("platform.deletion");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [looked, setLooked] = useState(false);
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    approveDeletionAction,
    {},
  );
  // Done: the request is about to read "Approved", so there is nothing left to ask.
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={blocked}>
          <Check /> {t("approve")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Check} hue="green">
          <DialogTitle>{t("approveTitle")}</DialogTitle>
          <DialogDescription>{t("approveBody", { name })}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className={dialogFormClass}>
          <input type="hidden" name="id" value={id} />
          <div className="space-y-4 px-5 sm:px-6">
            <FormAlert message={state.error} stepUp={state.stepUp} />
            <Field name="note" label={t("noteLabel")}>
              <Textarea name="note" rows={3} maxLength={2000} />
            </Field>
            {hasFindings && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="acknowledged"
                  checked={looked}
                  onChange={(event) => setLooked(event.target.checked)}
                  className="mt-0.5 size-4"
                />
                <span>{t("acknowledge")}</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton
              label={t("approve")}
              icon={<Check />}
              disabled={hasFindings && !looked}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ id, name, approved }: { id: number; name: string; approved: boolean }) {
  const t = useTranslations("platform.deletion");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    rejectDeletionAction,
    {},
  );
  const label = approved ? t("cancelDeletion") : t("reject");
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserX /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={UserX} hue="red">
          <DialogTitle>{approved ? t("cancelTitle") : t("rejectTitle")}</DialogTitle>
          <DialogDescription>{t("rejectBody", { name })}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className={dialogFormClass}>
          <input type="hidden" name="id" value={id} />
          <div className="space-y-4 px-5 sm:px-6">
            <FormAlert message={state.error} stepUp={state.stepUp} />
            <Field name="note" label={t("noteLabel")}>
              <Textarea name="note" rows={3} maxLength={2000} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton label={label} icon={<UserX />} variant="destructive" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
