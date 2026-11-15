"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Link } from "@office/i18n/navigation";
import { type AuthFormState, forgotPasswordAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton() {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
      {t("forgotSubmit")}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    {},
  );

  // Success is reported identically whether or not the account exists, so
  // this panel is the end of the road either way — there is deliberately no
  // "we couldn't find that account" branch to fall back to.
  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="text-status-success mx-auto size-8" aria-hidden />
        <p className="font-medium">{t("forgotSentTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("forgotSentBody")}</p>
        <p className="text-muted-foreground/80 text-xs">{t("forgotSentNote")}</p>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft /> {t("backToSignIn")}
          </Link>
        </Button>
      </div>
    );
  }

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

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email ?? ""}
          autoComplete="username"
          autoFocus
          required
          aria-invalid={state.field === "identifier"}
        />
        {/* Their password is the one on suliko.ge, and a phone-only account has no
            address for us to write to — so say where the reset really happens. */}
        <p className="text-muted-foreground text-xs">{t("forgotManagedNote")}</p>
      </div>

      <div className="space-y-2 pt-2">
        <SubmitButton />
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft /> {t("backToSignIn")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
