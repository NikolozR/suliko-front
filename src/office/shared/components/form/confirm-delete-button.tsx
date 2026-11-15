"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useFormStatus } from "react-dom";

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
 * cheap to make and expensive to undo. The dialog names the record being
 * deleted rather than asking a generic "are you sure?" — a confirmation you
 * can dismiss without reading is not a confirmation.
 *
 * The action is passed in rather than imported, so one component serves every
 * entity and each caller keeps its own server action and its own explanation
 * of why a delete might be refused.
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

export function ConfirmDeleteButton({
  id,
  name,
  description,
  action,
  fields = {},
  compact = false,
}: {
  id: number;
  /** Shown in the dialog title, so the user sees what they are deleting. Translated. */
  name: string;
  /** Kept for existing callers; the button now reads a plain "Delete". */
  entity?: string;
  /** What deletion does, and when the database will refuse it. */
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  /** More hidden fields for the action — where to return to, say. */
  fields?: Record<string, string>;
  /** A small ghost icon, for a table row rather than a page header. */
  compact?: boolean;
}) {
  const t = useTranslations("common");
  const tConfirm = useTranslations("confirm");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon-sm" : "sm"}
          aria-label={tConfirm("deleteAria", { name })}
          title={tConfirm("deleteAria", { name })}
        >
          <Trash2 />
        </Button>
      </DialogTrigger>

      {/* Clicks inside a dialog bubble through React to a clickable table row
          behind it; `data-row-ignore` stops them opening that row. */}
      <DialogContent className="sm:max-w-md" data-row-ignore>
        <DialogHeader icon={Trash2} hue="red">
          <DialogTitle className="break-words">
            {tConfirm("deleteTitle", { name: shortName(name) })}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* The form holds the whole footer, so both buttons are its own
            children and stretch alike when they stack on a phone. */}
        <form action={action} className={dialogFormClass}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="locale" value={locale} />
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <ConfirmButton label={tConfirm("deleteButton")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
