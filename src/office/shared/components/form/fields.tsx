"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { KeyRound, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";

import { Link, usePathname } from "@office/i18n/navigation";

import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { Textarea } from "@office/shared/components/ui/textarea";
import { cn } from "@office/shared/lib/utils";

/**
 * The pieces every form in Suliko Office is made of.
 *
 * Extracted because there are now six of them (clients, translators, notaries,
 * orders, users, payments) and a label/hint/error trio re-typed six times
 * drifts: one form ends up announcing its errors to screen readers and the
 * next one does not. One copy, one behaviour.
 */

/** A bare input, select or textarea, which `Field` may give its `id`. */
function isControl(element: ReactElement): boolean {
  return (
    element.type === Input ||
    element.type === Textarea ||
    (typeof element.type === "string" && ["input", "select", "textarea"].includes(element.type))
  );
}

/** The props `Field` reads off, and adds to, the control it wraps. */
interface ControlProps {
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

/**
 * A labelled control with its hint and its errors.
 *
 * The hint is suppressed once there is an error — showing both puts advice the
 * user has already failed to follow directly under the failure.
 *
 * When the child is the control itself (its `id` is `name`, or it has none),
 * the field wires it up: `aria-invalid` while there is an error,
 * `aria-describedby` pointing at the error or the hint, `aria-required`. A
 * screen reader then reads the message on reaching the field, which a red line
 * under it alone never told anyone (audit F02, F11). A child that is a wrapper
 * (a picker, a select with a "+" beside it) wires its own control.
 */
export function Field({
  name,
  label,
  errors,
  hint,
  className,
  required,
  children,
}: {
  /** Must match the control's `id`, so the label actually points at it. */
  name: string;
  label: string;
  errors?: string[];
  hint?: ReactNode;
  className?: string;
  /**
   * Marks the label with an asterisk. Visual only — the actual constraint is
   * enforced by the server action's Zod schema (whose error renders below),
   * never by the browser's native `required` attribute: that blocks
   * submission silently for a field inside a closed accordion or a
   * conditionally-hidden section, with nothing on screen explaining why
   * nothing happened.
   */
  required?: boolean;
  children: ReactNode;
}) {
  const hasError = Boolean(errors?.length);
  const showHint = Boolean(hint) && !hasError;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  const control = isValidElement<ControlProps>(children) ? children : null;
  const wired =
    control !== null &&
    (control.props.id === name || (control.props.id === undefined && isControl(control)));
  // A control marked `required` itself gets the asterisk too, so the two
  // can never disagree on screen.
  const isRequired = required || Boolean(wired && control?.props.required);

  const describedBy =
    [control?.props["aria-describedby"], hasError ? errorId : showHint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {isRequired && (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        )}
      </Label>
      {wired
        ? cloneElement(control as ReactElement<ControlProps>, {
            id: name,
            "aria-invalid": hasError || control.props["aria-invalid"] || undefined,
            "aria-describedby": describedBy,
            "aria-required": isRequired || undefined,
          })
        : children}
      {showHint && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-destructive text-xs">
          {errors?.join(" ")}
        </p>
      )}
    </div>
  );
}

/**
 * A message under a control that is not wrapped in `Field` (a document row's
 * selects). `id` is the control's; the message takes `${id}-error`, which is
 * what the control's `aria-describedby` points at.
 */
export function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={`${id}-error`} className="text-destructive text-xs">
      {messages.join(" ")}
    </p>
  );
}

/**
 * After a failed submit, take the person to what needs fixing: focus the first
 * control marked invalid, or else the form's alert. Without it focus stayed on
 * the submit button (or dropped to the page body) while the problem sat above
 * the fold, out of sight (audit F02).
 *
 * Pass the form's ref; the hook re-runs on every new result, so a second
 * failure with the same message still moves focus.
 */
export function useFocusOnError(
  formRef: RefObject<HTMLFormElement | null>,
  state: { error?: string; fieldErrors?: object },
) {
  useEffect(() => {
    if (!state.error && !state.fieldErrors) return;
    const form = formRef.current;
    if (!form) return;
    const target =
      form.querySelector<HTMLElement>("[aria-invalid='true']") ??
      form.querySelector<HTMLElement>("[data-form-alert]");
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center" });
  }, [formRef, state]);
}

/**
 * Submit, disabled and spinning while the action runs.
 *
 * `useFormStatus` rather than a prop: it reads the pending state of the
 * enclosing form directly, so this cannot fall out of sync with the action the
 * way a manually threaded `isPending` does.
 */
export function SubmitButton({
  label,
  icon,
  variant = "brand",
  pending: pendingProp,
  disabled = false,
}: {
  label: string;
  icon?: ReactNode;
  variant?: "brand" | "destructive" | "outline";
  /** For a form submitted by hand, which `useFormStatus` cannot see. */
  pending?: boolean;
  /** Not yet allowed to submit: something the person still has to do. */
  disabled?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" variant={variant} disabled={pending || disabled}>
      {pending ? <Loader2 className="animate-spin" /> : (icon ?? <Save />)}
      {label}
    </Button>
  );
}

/** Form-level failure — the one the field errors could not explain. */
export function FormAlert({ message, stepUp }: { message?: string; stepUp?: boolean }) {
  const t = useTranslations("errors");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  if (!message) return null;
  // The API wants a fresh 2FA code before this action. Say so, and give the
  // way to provide one that comes back to this page.
  const needsCode = stepUp ?? message === t("stepUp");
  return (
    <div
      role="alert"
      // Focusable by script only, so `useFocusOnError` can land on it when
      // no single field is at fault.
      tabIndex={-1}
      data-form-alert
      className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border px-3 py-2 text-sm outline-none"
    >
      {message}
      {needsCode && (
        <Link
          href={`/two-factor?step_up=1&next=${encodeURIComponent(pathname)}`}
          className="mt-1 flex items-center gap-1 font-medium underline underline-offset-2"
        >
          <KeyRound className="size-3.5" aria-hidden /> {tAuth("stepUpTitle")}
        </Link>
      )}
    </div>
  );
}

/**
 * Styling for a native `<select>`.
 *
 * Native, not the Radix one, everywhere inside a form: Radix's trigger is a
 * button holding its value in React state, which never reaches FormData and so
 * arrives at the server action as `undefined`.
 */
export const selectClass = cn(
  "border-input bg-background h-9 pointer-coarse:h-11 w-full rounded-md border px-3 py-1 text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);
