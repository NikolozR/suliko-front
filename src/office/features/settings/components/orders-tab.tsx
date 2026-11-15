"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Check, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  saveBureauPairAction,
  saveOrderConsentAction,
  type SettingsFormState,
} from "@office/features/settings/actions";
import type { Language, PairPrice } from "@office/features/settings/api";
import { RowDialog, useRowEditor } from "@office/features/settings/components/row-dialog";
import { Field, FormAlert, selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { cn } from "@office/shared/lib/utils";
import { CURRENCY_SYMBOL, formatMoneyString } from "@office/shared/lib/money";

/**
 * A freelancer's own answer to "may other bureaus send you orders?", and the
 * rates a bureau pays them.
 *
 * The question is the one the account chooser asks after sign-up, in the same
 * words ("you can change this later" is true because of this tab). The rates
 * are only shown while the answer is yes; switching to no hides them and keeps
 * them, so nobody retypes a price list after changing their mind. A bureau rate
 * is separate from `price_per_page`, which is what the freelancer charges their
 * own clients.
 */

function pairLabel(pair: { source_language: string; target_language: string }) {
  return `${pair.source_language.toUpperCase()} → ${pair.target_language.toUpperCase()}`;
}

function SaveConsent({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

function ConsentForm({ accepts }: { accepts: boolean | null }) {
  const t = useTranslations("auth.choose");
  const ts = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    saveOrderConsentAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast.success(tc("saved"));
  }, [state.ok, tc]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-3">
          <FormAlert message={state.error} stepUp={state.stepUp} />
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">{t("consentLegend")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["yes", "no"] as const).map((value) => {
                const yes = value === "yes";
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-colors",
                      "border-border hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
                      yes
                        ? "has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:focus-visible]:ring-emerald-500"
                        : "has-[:checked]:border-slate-500 has-[:checked]:bg-slate-500/10 has-[:focus-visible]:ring-slate-500",
                    )}
                  >
                    <input
                      type="radio"
                      name="bureau_orders"
                      value={value}
                      defaultChecked={accepts === yes}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "text-muted-foreground mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                        yes
                          ? "peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white"
                          : "peer-checked:border-slate-500 peer-checked:bg-slate-500 peer-checked:text-white",
                      )}
                    >
                      {yes ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <X className="size-3.5" aria-hidden />
                      )}
                    </span>
                    <span>{yes ? t("consentYes") : t("consentNo")}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">{t("consentHint")}</p>
          </fieldset>
          <SaveConsent label={ts("save")} />
        </form>
      </CardContent>
    </Card>
  );
}

export function OrdersTab({
  accepts,
  pairs,
  languages,
}: {
  accepts: boolean | null;
  pairs: PairPrice[];
  /** Drives the dropdowns, so a pair cannot name a language that does not exist. */
  languages: Language[];
}) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const editor = useRowEditor<PairPrice>();
  const row = editor.editing ?? null;

  const active = languages.filter((l) => l.is_active);
  const nameOf = (language: Language) => (locale === "ka" ? language.name_ka : language.name_en);
  const offered = pairs.filter((pair) => pair.is_active);
  const unset = offered.some(
    (pair) => pair.price_per_page_bureau === null || pair.price_per_page_bureau === undefined,
  );

  return (
    <div className="space-y-4">
      <ConsentForm accepts={accepts} />

      {accepts !== true ? (
        <p className="text-muted-foreground text-sm">{t("orders.off")}</p>
      ) : (
        <>
          {unset && (
            <div className="border-status-warning/40 bg-status-warning/[0.06] flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
              <AlertTriangle className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="text-muted-foreground">{t("orders.missing")}</p>
            </div>
          )}

          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{t("orders.ratesTitle")}</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">{t("orders.ratesBody")}</p>
              </div>
              <Button
                variant="brand"
                size="sm"
                onClick={editor.add}
                disabled={active.length < 2}
                title={active.length < 2 ? t("pricing.needLanguages") : undefined}
              >
                <Plus /> {t("orders.add")}
              </Button>
            </div>

            <CardContent className="p-0">
              {offered.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-sm">{t("orders.empty")}</p>
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">{t("pricing.pair")}</TableHead>
                        <TableHead className="w-40 text-right">{t("orders.clientRate")}</TableHead>
                        <TableHead className="w-40 text-right">{t("orders.bureauRate")}</TableHead>
                        <TableHead className="w-24 text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offered.map((pair) => (
                        <TableRow key={pair.id}>
                          <TableCell data-full className="font-mono text-xs uppercase">
                            {pair.source_language} → {pair.target_language}
                          </TableCell>
                          <TableCell
                            data-label={t("orders.clientRate")}
                            className="text-right tabular-nums"
                          >
                            {formatMoneyString(pair.price_per_page)}
                          </TableCell>
                          <TableCell
                            data-label={t("orders.bureauRate")}
                            className="text-right tabular-nums"
                          >
                            {pair.price_per_page_bureau === null ||
                            pair.price_per_page_bureau === undefined ? (
                              <span className="text-status-warning">{t("orders.notSet")}</span>
                            ) : (
                              formatMoneyString(pair.price_per_page_bureau)
                            )}
                          </TableCell>
                          <TableCell data-label={t("actions")}>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("editName", { name: pairLabel(pair) })}
                                onClick={() => editor.edit(pair)}
                              >
                                <Pencil />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <RowDialog
            key={editor.key}
            open={editor.isOpen}
            onOpenChange={editor.close}
            icon={row ? Pencil : Plus}
            title={row ? t("editName", { name: pairLabel(row) }) : t("orders.dialogAdd")}
            description={t("orders.dialogDescription")}
            action={saveBureauPairAction}
          >
            {(state) => {
              const errors = state.fieldErrors ?? {};
              const value = (field: string, fallback?: string) =>
                state.values?.[field] ?? fallback ?? "";

              return (
                <>
                  {row ? (
                    <>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="source_language" value={row.source_language} />
                      <input type="hidden" name="target_language" value={row.target_language} />
                      {/* Not on this form, but the API replaces the row, so
                          they go back as they were. */}
                      <input
                        type="hidden"
                        name="price_per_minute"
                        value={row.price_per_minute ?? ""}
                      />
                      {row.is_active && <input type="hidden" name="is_active" value="on" />}
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="is_active" value="on" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          name="source_language"
                          label={t("pricing.from")}
                          errors={errors.source_language}
                        >
                          <select
                            id="source_language"
                            name="source_language"
                            className={selectClass}
                            defaultValue={value("source_language")}
                            required
                          >
                            <option value="">–</option>
                            {active.map((language) => (
                              <option key={language.code} value={language.code}>
                                {nameOf(language)}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field
                          name="target_language"
                          label={t("pricing.to")}
                          errors={errors.target_language}
                        >
                          <select
                            id="target_language"
                            name="target_language"
                            className={selectClass}
                            defaultValue={value("target_language")}
                            required
                          >
                            <option value="">–</option>
                            {active.map((language) => (
                              <option key={language.code} value={language.code}>
                                {nameOf(language)}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </>
                  )}

                  <Field
                    name="price_per_page"
                    label={t("orders.clientRateLabel", { currency: CURRENCY_SYMBOL })}
                    errors={errors.price_per_page}
                    hint={t("pricing.rateHint")}
                  >
                    <Input
                      id="price_per_page"
                      name="price_per_page"
                      inputMode="decimal"
                      defaultValue={value("price_per_page", row?.price_per_page)}
                      placeholder="15.00"
                      required
                    />
                  </Field>

                  <Field
                    name="price_per_page_bureau"
                    label={t("orders.bureauRateLabel", { currency: CURRENCY_SYMBOL })}
                    errors={errors.price_per_page_bureau}
                    hint={t("orders.bureauRateHint")}
                  >
                    <Input
                      id="price_per_page_bureau"
                      name="price_per_page_bureau"
                      inputMode="decimal"
                      defaultValue={value(
                        "price_per_page_bureau",
                        row?.price_per_page_bureau ?? undefined,
                      )}
                      placeholder="10.00"
                      required
                    />
                  </Field>
                </>
              );
            }}
          </RowDialog>
        </>
      )}
    </div>
  );
}
