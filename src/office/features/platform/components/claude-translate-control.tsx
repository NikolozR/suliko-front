"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setClaudeTranslateAction, type PlatformFormState } from "@office/features/platform/actions";
import { Button } from "@office/shared/components/ui/button";

function SaveButton() {
  const t = useTranslations("platform.claude");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      {t("save")}
    </Button>
  );
}

/**
 * Claude Translate for one organisation: a box to tick and save. Ticked, its staff
 * see "Translate by Claude" on an order and the Claude Code server serves its
 * queue; unticked, the button is gone and the server skips it. Jobs already
 * queued are kept either way.
 */
export function ClaudeTranslateControl({
  tenantId,
  enabled,
}: {
  tenantId: number;
  enabled: boolean;
}) {
  const t = useTranslations("platform.claude");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    setClaudeTranslateAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            // A new key when the saved value changes, so the box shows what is stored.
            key={String(enabled)}
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            className="size-4"
          />
          {t("enable")}
        </label>
        <SaveButton />
        {state.ok && !state.error && (
          <span role="status" className="text-status-success text-xs">
            {t("saved")}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{t("note")}</p>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
