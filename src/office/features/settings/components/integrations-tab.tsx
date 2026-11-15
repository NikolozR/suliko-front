"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  AlertTriangle,
  Check,
  CircleCheck,
  CircleDashed,
  KeyRound,
  Plug,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  checkIntegrationAction,
  removeIntegrationAction,
  saveIntegrationAction,
  type IntegrationFormState,
} from "@office/features/settings/integration-actions";
import { visibleIntegrations } from "@office/features/settings/integration-visibility";
import type { Integration } from "@office/features/settings/integrations";
import { Field, FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { Textarea } from "@office/shared/components/ui/textarea";
import { useTimezone } from "@office/shared/components/timezone-context";
import { formatDateTime } from "@office/shared/lib/dates";
import { cn } from "@office/shared/lib/utils";

/**
 * Settings → Integrations.
 *
 * ## Secrets are write-only, and the UI has to say so
 *
 * The API never returns a stored secret, so a secret input is always blank —
 * even for a provider that is fully configured. Left unexplained that looks
 * like data loss, and the natural reaction is to retype the key every time.
 * So a set secret shows a "Set — leave blank to keep" note next to it, and the
 * form only sends the ones actually typed into.
 *
 * ## One form per provider
 *
 * Not one big form: saving BOG should not touch SMTP, and each provider has
 * its own enable switch, its own check and its own delete.
 */

function StatusPill({ integration }: { integration: Integration }) {
  const t = useTranslations("settings.integrations");
  const { is_enabled, is_complete } = integration;

  const [label, className, Icon] = !is_complete
    ? ([t("notConfigured"), "bg-muted text-muted-foreground", CircleDashed] as const)
    : is_enabled
      ? ([t("enabled"), "bg-status-success text-white dark:text-neutral-950", CircleCheck] as const)
      : ([t("off"), "bg-status-warning/15 text-status-warning", CircleDashed] as const);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

function CheckButton() {
  const t = useTranslations("settings.integrations");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Plug /> {t("check")}
    </Button>
  );
}

function RemoveButton() {
  const t = useTranslations("settings.integrations");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      <Trash2 /> {t("remove")}
    </Button>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const t = useTranslations("settings.integrations");
  const tSettings = useTranslations("settings");
  // The API sends every provider text in English only. A message under
  // settings.integrations.providers.<provider>... wins; the API's text is the
  // fallback, so a provider without a translation still renders.
  const text = (key: string, fallback: string): string => {
    const path = `providers.${integration.provider}.${key}`;
    return t.has(path) ? t(path) : fallback;
  };
  const optionalText = (key: string, fallback: string | null | undefined) =>
    t.has(`providers.${integration.provider}.${key}`) ? text(key, "") : (fallback ?? undefined);
  const name = text("name", integration.name);
  const summary = text("summary", integration.summary);
  const enables = text("enables", integration.enables);
  const timeZone = useTimezone();
  const [state, formAction] = useActionState<IntegrationFormState, FormData>(
    saveIntegrationAction,
    {},
  );
  const [checkState, checkAction] = useActionState<IntegrationFormState, FormData>(
    checkIntegrationAction,
    {},
  );
  const [removeState, removeAction] = useActionState<IntegrationFormState, FormData>(
    removeIntegrationAction,
    {},
  );
  const [open, setOpen] = useState(false);

  const secretKeys = integration.fields.filter((f) => f.secret).map((f) => f.key);
  const setSecrets = new Set(integration.secrets_set);

  // Non-secret echo only — the action never returns a submitted secret.
  const value = (key: string) => {
    const echoed = state.values?.[key];
    if (echoed !== undefined) return echoed;
    const stored = integration.config[key];
    return stored === undefined || stored === null ? "" : String(stored);
  };

  const check = checkState.check ?? null;

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="hover:bg-accent/40 flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{name}</h3>
              <StatusPill integration={integration} />
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{summary}</p>
            {!open && (
              <p className="text-muted-foreground/80 mt-1 text-xs">{enables}</p>
            )}
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {open ? t("close") : t("configure")}
          </span>
        </button>

        {open && (
          <div className="border-border border-t px-5 py-4">
            <form action={formAction} noValidate className="space-y-4">
              <input type="hidden" name="provider" value={integration.provider} />
              {/* The form declares its own secret fields, so the action cannot
                  hold a stale copy of the registry. */}
              <input type="hidden" name="__secret_keys" value={secretKeys.join(",")} />

              <FormAlert message={state.error} />

              {state.ok && (
                <p className="border-status-success/40 bg-status-success/10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Check className="text-status-success size-4 shrink-0" aria-hidden />
                  {tSettings("saved")}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {integration.fields.map((field) => {
                  const isSet = field.secret && setSecrets.has(field.key);
                  const fieldLabel = text(`fields.${field.key}.label`, field.label);
                  const fieldHelp = optionalText(`fields.${field.key}.help`, field.help);
                  const placeholder = optionalText(`fields.${field.key}.placeholder`, field.placeholder);
                  const hint = field.secret
                    ? isSet
                      ? `${t("secretSet", {
                          when: integration.secrets_updated_at
                            ? formatDateTime(integration.secrets_updated_at, timeZone)
                            : "",
                        })} ${fieldHelp ?? ""}`
                      : (fieldHelp ?? t("secretNew"))
                    : fieldHelp;

                  return (
                    <Field
                      key={field.key}
                      name={`${integration.provider}-${field.key}`}
                      label={field.required ? fieldLabel : t("optional", { label: fieldLabel })}
                      hint={hint}
                      className={field.multiline ? "sm:col-span-2" : undefined}
                    >
                      {field.multiline ? (
                        <Textarea
                          id={`${integration.provider}-${field.key}`}
                          name={field.key}
                          rows={6}
                          defaultValue={field.secret ? "" : value(field.key)}
                          placeholder={
                            isSet ? t("stored") : placeholder
                          }
                          className="font-mono text-xs"
                        />
                      ) : (
                        <Input
                          id={`${integration.provider}-${field.key}`}
                          name={field.key}
                          type={field.secret ? "password" : "text"}
                          autoComplete={field.secret ? "new-password" : "off"}
                          // A secret input is ALWAYS blank: there is nothing
                          // to prefill it with, by design.
                          defaultValue={field.secret ? "" : value(field.key)}
                          placeholder={
                            isSet ? t("stored") : placeholder
                          }
                        />
                      )}
                    </Field>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${integration.provider}-enabled`}
                  name="is_enabled"
                  defaultChecked={integration.is_enabled}
                />
                <Label htmlFor={`${integration.provider}-enabled`} className="font-normal">
                  {t("enabledLabel")}: {enables}
                </Label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SubmitButton label={tSettings("save")} icon={<KeyRound />} />
              </div>
            </form>

            <div className="border-border mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <form action={checkAction}>
                <input type="hidden" name="provider" value={integration.provider} />
                <CheckButton />
              </form>

              {integration.is_complete && (
                <form
                  action={removeAction}
                  onSubmit={(event) => {
                    const question = `${t("removeTitle", { name })}\n\n${t(
                      "removeBody",
                    )}`;
                    if (!window.confirm(question)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="provider" value={integration.provider} />
                  <RemoveButton />
                </form>
              )}

              <p className="text-muted-foreground ml-auto text-xs">{t("checkNote")}</p>
            </div>

            {(check || integration.last_check_at) && (
              <p
                className={cn(
                  "mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                  (check ? check.ok : integration.last_check_ok)
                    ? "border-status-success/40 bg-status-success/10"
                    : "border-status-warning/40 bg-status-warning/10",
                )}
              >
                {(check ? check.ok : integration.last_check_ok) ? (
                  <Check className="text-status-success mt-0.5 size-3.5 shrink-0" aria-hidden />
                ) : (
                  <AlertTriangle
                    className="text-status-warning mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                )}
                <span className="text-muted-foreground">
                  {check?.detail ?? integration.last_check_detail}
                  {!check && integration.last_check_at && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      · {formatDateTime(integration.last_check_at, timeZone)}
                    </span>
                  )}
                </span>
              </p>
            )}

            {(checkState.error || removeState.error) && (
              <p role="alert" className="text-destructive mt-3 flex items-center gap-2 text-xs">
                <X className="size-3.5 shrink-0" aria-hidden />
                {checkState.error ?? removeState.error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationsTab({ integrations }: { integrations: Integration[] }) {
  const t = useTranslations("settings.integrations");
  const shown = visibleIntegrations(integrations);
  if (shown.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("none")}</p>;
  }
  return (
    <div className="space-y-3">
      <Card className="border-status-warning/40 bg-status-warning/[0.06]">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <KeyRound className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">{t("secretsTitle")}</span>{" "}
            {t("secretsBody")}
          </p>
        </CardContent>
      </Card>

      {shown.map((integration) => (
        <IntegrationCard key={integration.provider} integration={integration} />
      ))}
    </div>
  );
}
