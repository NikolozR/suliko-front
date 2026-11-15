"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { resendVerificationEmailAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";

/**
 * "Confirm your email" — shown on every page until it is.
 *
 * Nothing is disabled while this shows; see the docstring on
 * `POST /auth/verify-email` for why. This is a reminder, not a gate, so it
 * stays a thin strip rather than a modal that would have to be dismissed.
 *
 * A client component for the same reason as `MarkAllRead`: a bare
 * `<form action={...}>` here would have to return void, and a resend that
 * silently failed (rate-limited, a dead mail relay) would look identical to
 * one that worked.
 */
export function EmailVerificationBanner() {
  const t = useTranslations("account.verification");
  const [result, setResult] = useState<{ error?: string; sent?: boolean }>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-status-warning/40 bg-status-warning/10 mb-4 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm print:hidden">
      <Mail className="text-status-warning size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">{t("banner")}</p>
      <div className="flex shrink-0 items-center gap-2">
        {result?.error && <span className="text-destructive text-xs">{result.error}</span>}
        {result?.sent && !result.error && (
          <span className="text-status-success text-xs">{t("resent")}</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(undefined);
              const outcome = await resendVerificationEmailAction();
              setResult(outcome.error ? { error: outcome.error } : { sent: true });
            })
          }
        >
          {t("resend")}
        </Button>
      </div>
    </div>
  );
}
