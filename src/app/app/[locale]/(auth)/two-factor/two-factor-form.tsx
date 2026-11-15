"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { KeyRound, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Link } from "@office/i18n/navigation";
import { type AuthFormState, logoutAction, verifyMfaAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton() {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
      {t("verify")}
    </Button>
  );
}

export function TwoFactorForm({
  username,
  next = "",
  stepUp = false,
}: {
  username: string;
  next?: string;
  stepUp?: boolean;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(verifyMfaAction, {});

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-center text-sm">
        {t("signedInAs", { username })}
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next} />

        {state.error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">{t("code")}</Label>
          <Input
            id="code"
            name="code"
            // A recovery code is `abcde-fghij`, so this cannot be type="number"
            // or inputMode="numeric" — both would block the hyphen and letters.
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={11}
            placeholder="000000"
            className="text-center text-lg tracking-[0.3em]"
            aria-invalid={state.field === "code"}
          />
          <p className="text-muted-foreground text-xs">{t("codeHint")}</p>
        </div>

        <SubmitButton />
      </form>

      {stepUp && (
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/dashboard">{t("stepUpBack")}</Link>
        </Button>
      )}

      {/* Escape hatch: without this, someone who cannot produce a code is
          stuck on this page with a valid half-session and no way back. */}
      <form action={logoutAction}>
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          {t("useAnotherAccount")}
        </Button>
      </form>
    </div>
  );
}
