"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { KeyRound, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Link } from "@office/i18n/navigation";
import { type AuthFormState, resetPasswordAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton({ isInvite }: { isInvite: boolean }) {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
      {isInvite ? t("inviteSubmit") : t("resetSubmit")}
    </Button>
  );
}

export function ResetPasswordForm({
  token,
  isInvite = false,
  org = "",
}: {
  token: string;
  isInvite?: boolean;
  org?: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(resetPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {/* Carried through the form rather than held in state — it is a
          credential, and this way it never has to live in a React store. */}
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="invite" value={isInvite ? "1" : ""} />
      <input type="hidden" name="org" value={org} />

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
          {/* A dead link cannot be retried on this page, so offer the way out
              instead of leaving the user to find it. */}
          <Link
            href="/forgot-password?local=1"
            className="mt-1 block font-medium underline underline-offset-2"
          >
            {t("requestNewLink")}
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          minLength={12}
          aria-invalid={state.field === "password"}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-muted-foreground text-xs">
          {t("passwordHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">{t("confirmPassword")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </div>

      <div className="pt-2">
        <SubmitButton isInvite={isInvite} />
      </div>
    </form>
  );
}
