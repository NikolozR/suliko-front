"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Save, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import type { SettingsFormState } from "@office/features/settings/actions";
import { FormAlert } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";

/**
 * The add/edit dialog every reference table on Settings uses.
 *
 * ## Why a dialog and not an inline row editor
 *
 * These rows have three or four fields each, and a couple of them are
 * consequential — a multiplier and a rate both feed `suliko.domain.pricing`
 * directly. An inline editor turns a table into a wall of inputs where a
 * stray keystroke saves a new price; a dialog makes editing a deliberate act
 * with a named subject and one Save button. It is also what the PHP app does,
 * so the muscle memory carries over.
 *
 * ## Closing on success
 *
 * The action returns `{ ok: true }` rather than redirecting, because these
 * screens stay put. This watches for that and closes, which is the one piece
 * of state the caller would otherwise have to wire up four times.
 */

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

export function RowDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  action,
  /** Rendered inside the form, given the last failed submit's state. */
  children,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The mark beside the title; Settings is a grey module. */
  icon?: LucideIcon;
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  children: (state: SettingsFormState) => ReactNode;
  submitLabel?: string;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SettingsFormState, FormData>(action, {});
  // Once something is typed, a click beside the dialog no longer closes it.
  const edited = useRef(false);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(tc("saved"));
    onOpenChange(false);
  }, [state.ok, onOpenChange, tc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(event) => {
          if (edited.current) event.preventDefault();
        }}
      >
        <DialogHeader icon={icon} hue="grey">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          action={formAction}
          className={dialogFormClass}
          onInput={() => {
            edited.current = true;
          }}
        >
          <DialogBody className="space-y-4">
            <FormAlert message={state.error} stepUp={state.stepUp} />
            {children(state)}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <SaveButton label={submitLabel ?? t("save")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Open/close plus the row being edited, in one hook.
 *
 * `null` means "add". Remounting the dialog on every change of subject is
 * deliberate — `useActionState` keeps its last result otherwise, so opening
 * Edit after a failed Add would show the previous error against the new row.
 */
export function useRowEditor<T>() {
  const [editing, setEditing] = useState<T | null | undefined>(undefined);

  return {
    /** undefined = closed, null = adding, T = editing that row. */
    editing,
    isOpen: editing !== undefined,
    /** A key that changes per subject, so the dialog remounts. */
    key: editing === undefined ? "closed" : editing === null ? "new" : JSON.stringify(editing),
    add: () => setEditing(null),
    edit: (row: T) => setEditing(row),
    close: (open: boolean) => {
      if (!open) setEditing(undefined);
    },
  };
}
