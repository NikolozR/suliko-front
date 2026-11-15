"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

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
  DialogTrigger,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import type { Hue } from "@office/shared/lib/hues";

/**
 * A button that opens a form in a dialog, for work done without leaving the
 * page — recording a payment from an order, adding a document to it.
 *
 * The form, and its action state, live INSIDE the dialog content, which Radix
 * unmounts on close. So every opening starts clean: no error from the last
 * attempt, and a form that mints a fresh idempotency key. Keeping the state
 * up here instead would reopen the dialog already "done" and close it again.
 *
 * The action returns `{ ok: true }` to finish; the page it revalidated
 * re-renders underneath.
 *
 * Once something has been typed, a click on the dimmed page no longer closes
 * the dialog: a stray click beside it used to throw the half-filled form
 * away. Cancel, the cross and Escape still close it, on purpose.
 */

export interface DialogFormState {
  error?: string;
  ok?: boolean;
  stepUp?: boolean;
}

function Submit({ label, icon }: { label: string; icon?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {label}
    </Button>
  );
}

function DialogForm<S extends DialogFormState>({
  action,
  onDone,
  onEdited,
  submitLabel,
  submitIcon,
  children,
}: {
  action: (state: S, formData: FormData) => Promise<S>;
  onDone: () => void;
  onEdited: () => void;
  submitLabel: string;
  submitIcon?: ReactNode;
  children: (state: S) => ReactNode;
}) {
  const t = useTranslations("common");
  const [awaited, formAction] = useActionState(action, {} as Awaited<S>);
  const state = awaited as S;
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  // The dialog closing is the only other sign it worked; say so (audit F07).
  useEffect(() => {
    if (!state.ok) return;
    toast.success(t("saved"));
    onDone();
  }, [state.ok, onDone, t]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className={dialogFormClass}
      onInput={onEdited}
    >
      <DialogBody className="space-y-4">
        <FormAlert message={state.error} stepUp={state.stepUp} />
        {children(state)}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Submit label={submitLabel} icon={submitIcon} />
      </DialogFooter>
    </form>
  );
}

export function FormDialog<S extends DialogFormState>({
  trigger,
  title,
  description,
  icon,
  hue,
  action,
  submitLabel,
  submitIcon,
  children,
  wide = false,
}: {
  /** The button that opens it; rendered as the dialog trigger. */
  trigger: ReactNode;
  title: string;
  description?: string;
  /** The action's mark beside the title, in the hue of what it touches. */
  icon?: LucideIcon;
  hue?: Hue;
  action: (state: S, formData: FormData) => Promise<S>;
  submitLabel: string;
  submitIcon?: ReactNode;
  /** The fields, given the last failed submit's state. */
  children: (state: S) => ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // A ref, not state: nothing on screen changes when the first key is typed.
  const edited = useRef(false);
  const change = useCallback((next: boolean) => {
    edited.current = false;
    setOpen(next);
  }, []);
  const close = useCallback(() => change(false), [change]);
  const markEdited = useCallback(() => {
    edited.current = true;
  }, []);

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={wide ? "sm:max-w-2xl" : undefined}
        onInteractOutside={(event) => {
          if (edited.current) event.preventDefault();
        }}
      >
        <DialogHeader icon={icon} hue={hue}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogForm<S>
          action={action}
          onDone={close}
          onEdited={markEdited}
          submitLabel={submitLabel}
          submitIcon={submitIcon}
        >
          {children}
        </DialogForm>
      </DialogContent>
    </Dialog>
  );
}

/**
 * An idempotency key made once per form, after mount — see
 * `features/finances/actions.ts`. Made during render it would differ between
 * the server and the browser and break hydration.
 */
export function useIdempotencyKey(): string {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
  }, []);
  return key;
}
