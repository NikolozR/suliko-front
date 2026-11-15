"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowLeft, LayoutDashboard, RotateCw, ServerCrash } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";

/**
 * A screen that failed to render at all.
 *
 * The reader is a bureau's employee, so the words say what to do next, not
 * what to check on a server. The digest is the reference support can find in
 * the logs; the raw message is shown only in development.
 */
export function FatalError({
  title,
  error,
  reset,
}: {
  title?: string;
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <ServerCrash className="text-status-warning size-10" aria-hidden />
      <h1 className="text-xl font-semibold">{title ?? t("pageErrorTitle")}</h1>

      <p className="text-muted-foreground text-sm">{t("pageErrorBody")}</p>

      {process.env.NODE_ENV === "development" && error.message && (
        <pre className="bg-muted custom_scroll max-w-full overflow-x-auto rounded-md p-3 text-left text-xs">
          {error.message}
        </pre>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {reset && (
          <Button variant="brand" size="sm" onClick={reset}>
            <RotateCw /> {tCommon("tryAgain")}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft /> {tCommon("back")}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> {tCommon("goToDashboard")}
          </Link>
        </Button>
      </div>

      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          {t("reference", { ref: error.digest })}
        </p>
      )}
    </div>
  );
}
