"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@office/i18n/navigation";
import { acceptInvitationAction, type AcceptInvitationState } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";

/** Spends the invitation link once, as soon as this mounts — see `VerifyEmailClient`. */
export function AcceptInviteClient({ token }: { token: string }) {
  const t = useTranslations("auth.invite");
  const [state, setState] = useState<AcceptInvitationState | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    acceptInvitationAction(token).then(setState);
  }, [token]);

  if (state === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">{t("accepting")}</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <XCircle className="text-destructive size-8" aria-hidden />
        <p className="font-medium">{t("failedTitle")}</p>
        <p className="text-muted-foreground text-sm">{state.error}</p>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/login">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <CheckCircle2 className="text-status-success size-8" aria-hidden />
      <p className="font-medium">{t("doneTitle", { name: state.tenantName ?? "" })}</p>
      <p className="text-muted-foreground text-sm">{t("doneBody")}</p>
      <Button variant="brand" size="sm" className="w-full" asChild>
        <Link href="/login">{t("signIn")}</Link>
      </Button>
    </div>
  );
}
