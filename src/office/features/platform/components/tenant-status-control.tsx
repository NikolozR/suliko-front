"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Ban, Loader2, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setTenantStatusAction, type PlatformFormState } from "@office/features/platform/actions";
import type { TenantStatus } from "@office/features/platform/api";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function SubmitButton({ suspending }: { suspending: boolean }) {
  const t = useTranslations("platform.control");
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={suspending ? "destructive" : "brand"}
      size="sm"
      disabled={pending}
    >
      {pending ? <Loader2 className="animate-spin" /> : suspending ? <Ban /> : <Play />}
      {suspending ? t("suspend") : t("reinstate")}
    </Button>
  );
}

/**
 * Suspend or reinstate a bureau.
 *
 * Suspension takes effect on their very next request — `resolve_session`
 * checks the tenant's status every time — so this is not a soft flag. The
 * reason field is required for that direction and goes to the audit log:
 * locking a paying customer out should leave more behind than a timestamp.
 */
export function TenantStatusControl({
  tenantId,
  status,
  isOwnTenant,
}: {
  tenantId: number;
  status: TenantStatus;
  /** The API refuses self-suspension; saying so beats a 409. */
  isOwnTenant: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("platform.control");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    setTenantStatusAction,
    {},
  );

  const suspended = status === "suspended";
  const next: TenantStatus = suspended ? "active" : "suspended";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="status" value={next} />

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </div>
      )}

      {suspended ? (
        <p className="text-muted-foreground text-sm">{t("lockedOut")}</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">{t("suspendNote")}</p>
          <div className="space-y-2">
            <Label htmlFor="reason">{t("reason")}</Label>
            <Input
              id="reason"
              name="reason"
              required
              maxLength={500}
              placeholder={t("reasonPlaceholder")}
            />
          </div>
        </>
      )}

      {isOwnTenant && !suspended ? (
        <p className="text-muted-foreground text-xs">{t("ownTenant")}</p>
      ) : (
        <SubmitButton suspending={!suspended} />
      )}
    </form>
  );
}
