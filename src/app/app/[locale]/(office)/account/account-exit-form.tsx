"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthFormState } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton({ ready, icon, label }: { ready: boolean; icon: ReactNode; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending || !ready}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {label}
    </Button>
  );
}

/**
 * A form that ends this person's access: a typed word, and the password for an
 * account that has one here. Closing your own access to one organisation and
 * asking for the whole account to be deleted are the same form with a different
 * action. The API ends the session either way, so there is no success state to
 * draw.
 */
export function AccountExitForm({
  action,
  icon,
  submitLabel,
  idPrefix,
  confirmWord,
  askPassword,
}: {
  action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  icon: ReactNode;
  submitLabel: string;
  /** Keeps the field ids of two such forms on one page apart. */
  idPrefix: string;
  /** What has to be typed before the button works: the person's own username. */
  confirmWord: string;
  /** False when the password is suliko.ge's and there is none to ask for. */
  askPassword: boolean;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [typed, setTyped] = useState("");
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </div>
      )}

      {askPassword && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}Password`}>{t("currentPassword")}</Label>
          <Input
            id={`${idPrefix}Password`}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.field === "currentPassword"}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}Confirm`}>{t("leaveConfirmLabel", { word: confirmWord })}</Label>
        <Input
          id={`${idPrefix}Confirm`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
        />
      </div>

      <SubmitButton ready={typed.trim() === confirmWord} icon={icon} label={submitLabel} />
    </form>
  );
}
