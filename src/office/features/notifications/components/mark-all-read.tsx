"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { markAllReadAction } from "@office/features/notifications/actions";
import { Button } from "@office/shared/components/ui/button";

/**
 * "Mark all read".
 *
 * A client component only so the failure is visible. A bare
 * `<form action={...}>` would have to return void, which means a failed
 * request looks exactly like a successful one — the badge simply does not
 * clear and the user has no idea why.
 */
export function MarkAllRead({ unread }: { unread: number }) {
  const t = useTranslations("notifications");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (unread === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-destructive text-xs">{error}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(undefined);
            const result = await markAllReadAction();
            if (result.error) setError(result.error);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
        {t("markAllRead")}
      </Button>
    </div>
  );
}
