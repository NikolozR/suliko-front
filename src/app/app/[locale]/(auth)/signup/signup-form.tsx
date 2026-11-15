"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Building2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Link } from "@office/i18n/navigation";
import { type AuthFormState, signupAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton() {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Building2 />}
      {t("signupSubmit")}
    </Button>
  );
}

export function SignupForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(signupAction, {});

  // Every submission returns a fresh state object, so this fires once per
  // attempt. The fixed id keeps a repeat (or Strict Mode's double effect)
  // from stacking a second copy of the same toast.
  useEffect(() => {
    if (state.toast && state.error) toast.error(state.error, { id: "signup-error" });
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state.error && !state.toast && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="organisation">{t("signupOrganisation")}</Label>
        <Input
          id="organisation"
          name="organisation"
          defaultValue={state.values?.organisation ?? ""}
          autoComplete="organization"
          autoFocus
          required
          aria-invalid={state.field === "tenant"}
          aria-describedby="organisation-hint"
        />
        <p id="organisation-hint" className="text-muted-foreground text-xs">
          {t("signupOrganisationHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("signupFullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={state.values?.fullName ?? ""}
          autoComplete="name"
          required
          aria-invalid={state.field === "username"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("signupEmail")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email ?? ""}
          autoComplete="email"
          required
          aria-invalid={state.field === "identifier"}
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="text-muted-foreground text-xs">
          {t("signupEmailHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("signupPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          aria-invalid={state.field === "password"}
          aria-describedby="signup-password-hint"
        />
        <p id="signup-password-hint" className="text-muted-foreground text-xs">
          {t("passwordHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">{t("signupConfirmPassword")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </div>

      <div className="space-y-2 pt-2">
        <SubmitButton />
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/login">{t("signupHaveAccount")}</Link>
        </Button>
      </div>
    </form>
  );
}
