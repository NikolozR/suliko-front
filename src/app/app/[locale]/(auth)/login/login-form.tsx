"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, LogIn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Link } from "@office/i18n/navigation";
import { type AuthFormState, loginAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

function SubmitButton() {
  const t = useTranslations("auth");
  // useFormStatus reads the *parent form's* pending state, which is why this
  // is a separate component — a hook in the form itself would always be false.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
      {t("signIn")}
    </Button>
  );
}

/**
 * Step one of signing in: the person's email or phone number, and password —
 * the same ones they use on suliko.ge. Which organisation comes next, on the
 * chooser — one password covers them all.
 */
export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {/* The server action redirects with the locale, so it needs to know it. */}
      <input type="hidden" name="locale" value={locale} />
      {/* Where to go once signed in — the page the session ran out on. */}
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
        <Label htmlFor="identifier">{t("loginName")}</Label>
        <Input
          id="identifier"
          name="identifier"
          // Not type="email": a phone number is a valid sign-in, and the browser
          // would refuse it.
          type="text"
          inputMode="email"
          defaultValue={state.values?.identifier ?? ""}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
          aria-invalid={state.field === "identifier"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.field === "password"}
        />
      </div>

      <div className={cn("space-y-2 pt-2")}>
        <SubmitButton />
        <Button variant="ghost" size="sm" className="w-full" asChild>
          {/* `local`: this form is the Office-only way in, so its reset is too. */}
          <Link href="/forgot-password?local=1">{t("forgotPassword")}</Link>
        </Button>
      </div>
    </form>
  );
}
