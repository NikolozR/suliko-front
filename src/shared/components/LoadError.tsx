"use client";

import { AlertCircle, LogIn, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";

/**
 * What a screen shows when its data could not be loaded: a sentence the person
 * can act on, never the technical message ("Failed to fetch", "No token found").
 * Signed out, it offers to sign in; otherwise to try again.
 */
export function isSignedOutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /no token|unauthori[sz]ed|\b401\b/i.test(message);
}

export function LoadError({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  /** One line, for narrow places such as the sidebar. */
  compact?: boolean;
}) {
  const t = useTranslations("Common");
  const signedOut = isSignedOutError(error);
  const title = signedOut ? t("signedOutTitle") : t("loadFailedTitle");
  const body = signedOut ? t("signedOutBody") : t("loadFailedBody");

  if (compact) {
    return (
      <div role="alert" className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
        <span>{title}</span>
        {signedOut ? (
          <Link href="/sign-in" className="font-medium text-primary underline-offset-2 hover:underline">
            {t("signIn")}
          </Link>
        ) : (
          onRetry && (
            <button type="button" onClick={onRetry} className="font-medium text-primary underline-offset-2 hover:underline">
              {t("tryAgain")}
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {signedOut ? (
        <Button asChild size="sm">
          <Link href="/sign-in">
            <LogIn className="h-4 w-4" aria-hidden />
            {t("signIn")}
          </Link>
        </Button>
      ) : (
        onRetry && (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t("tryAgain")}
          </Button>
        )
      )}
    </div>
  );
}
