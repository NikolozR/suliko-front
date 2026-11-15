"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";

/**
 * Segment error boundary.
 *
 * Next.js strips the message from server errors in production and replaces it
 * with a digest, so `error.message` is only useful in development. The digest
 * is shown regardless — it is what ties this screen to a line in the server
 * log when someone reports "the clients page is broken".
 */
export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("clients");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  useEffect(() => {
    console.error("[clients] failed to render", error);
  }, [error]);

  return (
    <>
      <PageHeader {...sectionMark("clients")} title={tNav("clients")} />
      <Card>
        <CardContent className="p-0">
          <ErrorState
            message={
              process.env.NODE_ENV === "development"
                ? error.message
                : t("loadFailed")
            }
            action={
              <div className="flex flex-col items-center gap-2">
                <Button variant="brand" size="sm" onClick={reset}>
                  <RotateCw /> {tCommon("tryAgain")}
                </Button>
                {error.digest && (
                  <p className="text-muted-foreground font-mono text-xs">
                    {tErrors("reference", { ref: error.digest })}
                  </p>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
