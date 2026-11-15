"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  deletePairPriceAction,
  savePairPriceAction,
  type SettingsFormState,
} from "@office/features/settings/actions";
import type { Language, PairPrice } from "@office/features/settings/api";
import { ActiveDot } from "@office/features/settings/components/active-dot";
import { RowDialog, useRowEditor } from "@office/features/settings/components/row-dialog";
import { EmptyState } from "@office/shared/components/data/states";
import { Field, selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { CURRENCY_SYMBOL, formatMoneyString } from "@office/shared/lib/money";

/**
 * Per-page rates, by language pair.
 *
 * This is the table the whole pricing engine reads. A pair with no row here
 * falls back to a hardcoded 15 ₾ and the quote panel warns about it, so an
 * empty table is not a cosmetic problem — it means every quote is a guess.
 *
 * Unlike languages and document types, a rate CAN be deleted: nothing
 * references it. Document costs are stored when an order is created, so
 * removing a rate changes future quotes only and leaves history intact.
 */

function pairLabel(pair: { source_language: string; target_language: string }) {
  return `${pair.source_language.toUpperCase()} → ${pair.target_language.toUpperCase()}`;
}

function DeleteButton({ pair, onDone }: { pair: PairPrice; onDone: () => void }) {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    deletePairPriceAction,
    {},
  );

  // Close once the server confirms, so the row disappearing and the dialog
  // closing happen together. In an effect: setting state while rendering (as
  // this first did) updates the parent mid-render, which React warns about.
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      onDone();
    }
  }, [state, onDone]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("pricing.deleteTitle", { pair: pairLabel(pair) })}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader icon={Trash2} hue="red">
            <DialogTitle>{t("pricing.deleteTitle", { pair: pairLabel(pair) })}</DialogTitle>
            <DialogDescription>{t("pricing.deleteBody")}</DialogDescription>
          </DialogHeader>

          {state.error && (
            <p role="alert" className="text-destructive px-5 pb-4 text-sm sm:px-6">
              {state.error}
            </p>
          )}

          <form action={formAction} noValidate className={dialogFormClass}>
            <input type="hidden" name="id" value={pair.id} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <ConfirmDelete label={t("pricing.deleteRate")} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmDelete({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      <Trash2 /> {label}
    </Button>
  );
}

export function PricingTab({
  pairs,
  languages,
}: {
  pairs: PairPrice[];
  /** Drives the dropdowns, so a rate cannot name a language that does not exist. */
  languages: Language[];
}) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const editor = useRowEditor<PairPrice>();
  const row = editor.editing ?? null;

  const active = languages.filter((l) => l.is_active);
  const nameOf = (language: Language) => (locale === "ka" ? language.name_ka : language.name_en);

  return (
    <>
      {pairs.length === 0 && (
        <div className="border-status-warning/40 bg-status-warning/[0.06] mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
          <AlertTriangle className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">{t("pricing.noRatesTitle")}</span>{" "}
            {t("pricing.noRatesBody")}
          </p>
        </div>
      )}

      <Card className="overflow-hidden py-0">
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("pricing.title")}{" "}
            <span className="text-muted-foreground font-normal">({pairs.length})</span>
          </h2>
          <Button
            variant="brand"
            size="sm"
            onClick={editor.add}
            disabled={active.length < 2}
            title={active.length < 2 ? t("pricing.needLanguages") : undefined}
          >
            <Plus /> {t("pricing.add")}
          </Button>
        </div>

        <CardContent className="p-0">
          {pairs.length === 0 ? (
            <EmptyState
              hue={sectionMark("settings").hue}
              title={t("pricing.emptyTitle")}
              body={active.length < 2 ? t("pricing.emptyNeedLanguages") : t("pricing.emptyBody")}
              action={
                active.length >= 2 ? (
                  <Button variant="brand" size="sm" onClick={editor.add}>
                    <Plus /> {t("pricing.add")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="custom_scroll">
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">{t("pricing.pair")}</TableHead>
                    <TableHead className="w-32 text-right">{t("pricing.perPage")}</TableHead>
                    <TableHead className="w-32 text-right">{t("pricing.perMinute")}</TableHead>
                    <TableHead className="w-24">{t("status")}</TableHead>
                    <TableHead className="w-24 text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map((pair) => (
                    <TableRow key={pair.id}>
                      <TableCell data-full className="font-mono text-xs uppercase">
                        {pair.source_language} → {pair.target_language}
                      </TableCell>
                      <TableCell data-label={t("pricing.perPage")} className="text-right tabular-nums">
                        {formatMoneyString(pair.price_per_page)}
                      </TableCell>
                      <TableCell data-label={t("pricing.perMinute")} className="text-right tabular-nums">
                        {pair.price_per_minute === null || pair.price_per_minute === undefined ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          formatMoneyString(pair.price_per_minute)
                        )}
                      </TableCell>
                      <TableCell data-label={t("status")}><ActiveDot active={pair.is_active} /></TableCell>
                      <TableCell data-label={t("actions")}>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("editName", { name: pairLabel(pair) })}
                            onClick={() => editor.edit(pair)}
                          >
                            <Pencil />
                          </Button>
                          <DeleteButton pair={pair} onDone={() => editor.close(false)} />
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
        title={row ? t("editName", { name: pairLabel(row) }) : t("pricing.dialogAdd")}
        description={t("pricing.dialogDescription")}
        action={savePairPriceAction}
      >
        {(state) => {
          const errors = state.fieldErrors ?? {};
          const value = (field: string, fallback?: string) =>
            state.values?.[field] ?? fallback ?? "";

          return (
            <>
              {row && <input type="hidden" name="id" value={row.id} />}

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
                    defaultValue={value("source_language", row?.source_language)}
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
                    defaultValue={value("target_language", row?.target_language)}
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

              <Field
                name="price_per_page"
                label={t("pricing.rate", { currency: CURRENCY_SYMBOL })}
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
                name="price_per_minute"
                label={t("pricing.rateMinute", { currency: CURRENCY_SYMBOL })}
                errors={errors.price_per_minute}
                hint={t("pricing.rateMinuteHint")}
              >
                <Input
                  id="price_per_minute"
                  name="price_per_minute"
                  inputMode="decimal"
                  defaultValue={value("price_per_minute", row?.price_per_minute ?? undefined)}
                  placeholder="2.00"
                />
              </Field>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={
                    state.values ? state.values.is_active === "on" : (row?.is_active ?? true)
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  {t("pricing.activeLabel")}
                </Label>
              </div>
            </>
          );
        }}
      </RowDialog>
    </>
  );
}
