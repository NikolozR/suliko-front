"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ExternalLink, Loader2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { syncOrderToDriveAction } from "@office/features/orders/drive-actions";
import { Button } from "@office/shared/components/ui/button";

/**
 * The order's Google Drive copy: a link to its folder and a button that copies
 * whatever is not there yet. Copying also runs by itself after every upload, so
 * the button is for a copy that failed or an order made before Drive was
 * connected. Only shown when the organisation has Drive connected.
 */
export function DriveBar({
  orderId,
  folderUrl,
  canWrite,
}: {
  orderId: number;
  folderUrl: string | null;
  canWrite: boolean;
}) {
  const t = useTranslations("driveMirror");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; bad: boolean } | null>(null);

  function copy() {
    setMessage(null);
    startTransition(async () => {
      const result = await syncOrderToDriveAction(orderId);
      if (!result.ok) return setMessage({ text: result.error, bad: true });
      if (!result.connected) return setMessage({ text: t("notConnected"), bad: true });
      setMessage(
        result.failed > 0
          ? { text: t("someFailed", { count: result.failed }), bad: true }
          : { text: t("copied", { count: result.copied }), bad: false },
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {folderUrl ? (
        <Button asChild variant="outline" size="sm">
          <a href={folderUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden />
            {t("open")}
          </a>
        </Button>
      ) : (
        <span className="text-muted-foreground text-xs">{t("pending")}</span>
      )}
      {canWrite && (
        <Button type="button" variant="outline" size="sm" onClick={copy} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-4" aria-hidden />
          )}
          {pending ? t("copying") : t("copy")}
        </Button>
      )}
      {message && (
        <span
          role="status"
          className={message.bad ? "text-hue-red-ink text-xs" : "text-muted-foreground text-xs"}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
