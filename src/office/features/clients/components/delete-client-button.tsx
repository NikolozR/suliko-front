"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteClientAction } from "@office/features/clients/actions";
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
import { shortName } from "@office/shared/lib/short-name";

/**
 * Delete, behind a confirmation.
 *
 * Deletion is irreversible and this button sits next to Edit, so a misclick is
 * cheap to make and expensive to undo. The dialog names the client being
 * deleted rather than asking a generic "are you sure?" — a confirmation you
 * can dismiss without reading is not a confirmation.
 */

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {label}
    </Button>
  );
}

export function DeleteClientButton({ id, name }: { id: number; name: string }) {
  const t = useTranslations("common");
  const td = useTranslations("clients.detail");
  const tConfirm = useTranslations("confirm");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={tConfirm("deleteAria", { name })}>
          <Trash2 />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Trash2} hue="red">
          <DialogTitle className="break-words">
            {tConfirm("deleteTitle", { name: shortName(name) })}
          </DialogTitle>
          <DialogDescription>{td("deleteDescription")}</DialogDescription>
        </DialogHeader>

        <form action={deleteClientAction} className={dialogFormClass}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="locale" value={locale} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <ConfirmButton label={td("deleteButton")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
