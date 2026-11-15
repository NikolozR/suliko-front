"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@office/i18n/navigation";
import { verifyEmailAction, type VerifyEmailState } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";

/**
 * Spends the confirmation link, once, as soon as this mounts.
 *
 * A client component so the token is spent exactly once regardless of how
 * many times React might render this tree — `useRef`, not a dependency on
 * `token`, guards the call itself. There is nothing for the visitor to type;
 * confirming an address is a one-click action, unlike `/reset-password`,
 * which waits for a password before it spends its token.
 */
export function VerifyEmailClient({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, setState] = useState<VerifyEmailState | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    verifyEmailAction(token).then(setState);
  }, [token]);

  if (state === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">{t("verifyingEmail")}</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <XCircle className="text-destructive size-8" aria-hidden />
        <p className="font-medium">{t("verifyEmailFailedTitle")}</p>
        <p className="text-muted-foreground text-sm">{state.error}</p>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <CheckCircle2 className="text-status-success size-8" aria-hidden />
      <p className="font-medium">{t("verifyEmailDoneTitle")}</p>
      <p className="text-muted-foreground text-sm">{t("verifyEmailDoneBody")}</p>
      <Button variant="brand" size="sm" className="w-full" asChild>
        <Link
          href={
            state.tenantSlug
              ? `/login?org=${encodeURIComponent(state.tenantSlug)}`
              : "/login"
          }
        >
          {t("continueToLogin")}
        </Link>
      </Button>
    </div>
  );
}
