"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Plus, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { FormAlert, useFocusOnError } from "@office/shared/components/form/fields";
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
import type { QuickAddState } from "@office/shared/lib/form-state";

/**
 * The "+" dialog behind every inline quick-add button — a client, a
 * translator, a notary, a document type — created without leaving the page
 * that needed one.
 *
 * Mirrors `RowDialog` in Settings, with one difference: on success the action
 * hands back the created record itself (`state.item`), not just `{ ok: true }`,
 * because the caller needs it immediately to select it in the field that
 * opened the dialog.
 *
 * The caller remounts this on every open (a changing `key`) so a failed
 * attempt's error does not linger into the next one.
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

export function QuickAddDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  action,
  onCreated,
  children,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  action: (state: QuickAddState<T>, formData: FormData) => Promise<QuickAddState<T>>;
  /** Called once, right after a successful create. */
  onCreated: (item: T) => void;
  children: (state: QuickAddState<T>) => ReactNode;
  submitLabel?: string;
}) {
  const t = useTranslations("forms");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<QuickAddState<T>, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);
  // Once something is typed, a click beside the dialog no longer closes it.
  const edited = useRef(false);

  useEffect(() => {
    if (state.item) {
      onCreated(state.item);
      onOpenChange(false);
    }
    // Fire only when a fresh item lands — `onCreated`/`onOpenChange` are
    // recreated every render and must not retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(event) => {
          if (edited.current) event.preventDefault();
        }}
      >
        <DialogHeader icon={Plus} hue="blue">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          noValidate
          className={dialogFormClass}
          onInput={() => {
            edited.current = true;
          }}
        >
          <DialogBody className="space-y-4">
            <FormAlert message={state.error} />
            {children(state)}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <SaveButton label={submitLabel ?? t("saveAndSelect")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
