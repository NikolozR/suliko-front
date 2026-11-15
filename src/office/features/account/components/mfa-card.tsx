"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { MfaEnrolment, RecoveryCodes } from "@office/features/account/components/mfa-enrolment";
import {
  disableMfaAction,
  type MfaActionState,
  regenerateRecoveryCodesAction,
} from "@office/features/account/mfa-actions";
import { useRouter } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

export interface MfaStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
  canDisable: boolean;
}

function SubmitButton({
  label,
  variant = "outline",
  icon,
}: {
  label: string;
  variant?: "outline" | "destructive";
  icon: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {label}
    </Button>
  );
}

/** A code-guarded action: regenerate recovery codes, or switch 2FA off. */
function CodeForm({
  action,
  label,
  variant,
  icon,
  onDone,
}: {
  action: (state: MfaActionState, formData: FormData) => Promise<MfaActionState>;
  label: string;
  variant?: "outline" | "destructive";
  icon: React.ReactNode;
  onDone: (state: MfaActionState) => void;
}) {
  const t = useTranslations("auth.mfa");
  const locale = useLocale();
  const [state, formAction] = useActionState<MfaActionState, FormData>(
    async (previous, formData) => {
      const next = await action(previous, formData);
      if (!next.error) onDone(next);
      return next;
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Label htmlFor={`code-${label}`}>{t("codeToConfirm")}</Label>
      <div className="flex gap-2">
        <Input
          id={`code-${label}`}
          name="code"
          autoComplete="one-time-code"
          maxLength={11}
          placeholder="000000"
          className="max-w-40 font-mono"
          required
        />
        <SubmitButton label={label} variant={variant} icon={icon} />
      </div>
    </form>
  );
}

/**
 * Two-factor on the Account screen: on, off, and fresh recovery codes.
 *
 * Before this, adding a factor meant running a command on the API server —
 * so no customer could turn it on, and with no factor anywhere, step-up was
 * skipped for everyone.
 */
export function MfaCard({ status }: { status: MfaStatus }) {
  const t = useTranslations("auth.mfa");
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "enrol" | "regenerate" | "disable">("idle");
  const [codes, setCodes] = useState<string[] | null>(null);

  const finish = () => {
    setMode("idle");
    setCodes(null);
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          {status.enabled ? (
            <ShieldCheck className="text-status-success mt-0.5 size-5 shrink-0" aria-hidden />
          ) : (
            <ShieldOff className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
          )}
          <div className="space-y-1">
            <h2 className="font-semibold">{t("cardTitle")}</h2>
            <p className="text-muted-foreground text-sm">
              {status.enabled ? t("statusOn") : t("statusOff")}
            </p>
            {status.enabled && (
              <p className="text-muted-foreground text-xs">
                {t("recoveryRemaining", { count: status.recoveryCodesRemaining })}
              </p>
            )}
          </div>
        </div>

        {codes ? (
          <RecoveryCodes codes={codes} onDone={finish} />
        ) : mode === "enrol" ? (
          <MfaEnrolment onFinished={finish} />
        ) : mode === "regenerate" ? (
          <CodeForm
            action={regenerateRecoveryCodesAction}
            label={t("regenerate")}
            icon={<KeyRound />}
            onDone={(state) => setCodes(state.recoveryCodes ?? null)}
          />
        ) : mode === "disable" ? (
          <CodeForm
            action={disableMfaAction}
            label={t("turnOff")}
            variant="destructive"
            icon={<ShieldOff />}
            onDone={finish}
          />
        ) : status.enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("regenerate")}>
              <KeyRound /> {t("regenerate")}
            </Button>
            {status.canDisable ? (
              <Button variant="outline" size="sm" onClick={() => setMode("disable")}>
                <ShieldOff /> {t("turnOff")}
              </Button>
            ) : (
              <p className="text-muted-foreground text-xs">{t("requiredNote")}</p>
            )}
          </div>
        ) : (
          <Button variant="brand" size="sm" onClick={() => setMode("enrol")}>
            <ShieldCheck /> {t("turnOn")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
