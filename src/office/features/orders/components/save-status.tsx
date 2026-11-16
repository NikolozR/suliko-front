"use client";
// Owned by suliko-front: the quiet save status of the Word editor screens,
// as on suliko.ge's own translation page.

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/** "Saving…", "Saved · 19:12", or "Could not save" with a retry. Nothing until the first edit. */
export function SaveStatus({
  dirty,
  saving,
  savedAt,
  failed,
  onRetry,
}: {
  dirty: boolean;
  saving: boolean;
  savedAt: Date | null;
  failed: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("files.workspace");
  const tc = useTranslations("common");

  if (failed) {
    return (
      <span role="status" className="text-destructive inline-flex items-center gap-1 text-xs whitespace-nowrap">
        <AlertCircle className="size-3.5" aria-hidden />
        {t("saveFailed")}
        <button type="button" onClick={onRetry} className="ml-1 underline underline-offset-2">
          {tc("tryAgain")}
        </button>
      </span>
    );
  }
  if (saving || dirty) {
    return (
      <span role="status" className="text-muted-foreground inline-flex items-center gap-1 text-xs whitespace-nowrap">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {tc("saving")}
      </span>
    );
  }
  if (savedAt) {
    const time = savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return (
      <span role="status" className="text-muted-foreground inline-flex items-center gap-1 text-xs whitespace-nowrap">
        <Check className="size-3.5" aria-hidden />
        {t("saved")} · {time}
      </span>
    );
  }
  return null;
}
