"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Copy, Download, Loader2, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  confirmEnrolmentAction,
  type EnrolmentStart,
  type MfaActionState,
  startEnrolmentAction,
} from "@office/features/account/mfa-actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
      {label}
    </Button>
  );
}

/**
 * Recovery codes, shown exactly once.
 *
 * Copy and download both, because the two failure modes are different: a
 * copied list gets pasted into a chat and forgotten, a downloaded file gets
 * found by the next person on the laptop. Offering both lets people pick what
 * fits how they keep secrets.
 */
export function RecoveryCodes({
  codes,
  onDone,
  doneLabel,
}: {
  codes: string[];
  onDone: () => void;
  doneLabel?: string;
}) {
  const t = useTranslations("auth.mfa");
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-medium">{t("recoveryTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("recoveryBody")}</p>
      </div>
      <ul className="bg-muted grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
        >
          {copied ? <Check /> : <Copy />} {t("recoveryCopy")}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(text + "\n")}`}
            download="suliko-recovery-codes.txt"
          >
            <Download /> {t("recoveryDownload")}
          </a>
        </Button>
      </div>
      <Button type="button" variant="brand" className="w-full" onClick={onDone}>
        {doneLabel ?? t("recoveryDone")}
      </Button>
    </div>
  );
}

/**
 * Scan, prove one code, save the recovery codes.
 *
 * Enrolment starts on mount (a fresh secret each time the panel opens — the
 * API replaces any unconfirmed one) and nothing is switched on until a code
 * checks out, so closing this half-way never locks anyone out.
 */
export function MfaEnrolment({ onFinished }: { onFinished: () => void }) {
  const t = useTranslations("auth.mfa");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const [started, setStarted] = useState<EnrolmentStart | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();
  const [state, formAction] = useActionState<MfaActionState, FormData>(
    confirmEnrolmentAction,
    {},
  );

  useEffect(() => {
    startTransition(async () => {
      const result = await startEnrolmentAction(locale);
      if (result.data) setStarted(result.data);
      else setStartError(result.error ?? t("startError"));
    });
    // Once per mount: a new secret each time the panel is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.recoveryCodes) {
    return <RecoveryCodes codes={state.recoveryCodes} onDone={onFinished} />;
  }

  if (startError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {startError}
      </p>
    );
  }

  if (isStarting || !started) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="text-muted-foreground animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-medium">{t("step1")}</p>
        {/* SVG rendered by the API from the otpauth URI; it contains the
            secret, so it is never logged or put in a URL. */}
        <div
          className="mx-auto w-44 rounded-md bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
          // Server-generated QR SVG from the API; no user input reaches it.
          dangerouslySetInnerHTML={{ __html: started.qrSvg }}
          aria-label="QR"
        />
        <p className="text-muted-foreground text-xs">{t("manualKey")}</p>
        <p className="bg-muted rounded px-2 py-1 text-center font-mono text-sm tracking-wider break-all">
          {started.secret}
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        {state.error && (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="mfa-code">{t("step2")}</Label>
          <Input
            id="mfa-code"
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.3em]"
            required
            aria-label={tAuth("code")}
          />
        </div>
        <Submit label={t("enable")} />
      </form>
    </div>
  );
}
