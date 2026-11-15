"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Languages, Loader2, Save } from "lucide-react";
import { useLocale } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { savePairPriceAction, type SettingsFormState } from "@office/features/settings/actions";
import { STARTING_RATE } from "@office/features/settings/starting-rate";
import { Field, FormAlert, selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import { Input } from "@office/shared/components/ui/input";

const SKIPPED = "suliko:first-languages-skipped";
const OPEN_EVENT = "suliko:open-first-languages";

interface Labels {
  title: string;
  body: string;
  from: string;
  to: string;
  pick: string;
  rate: string;
  rateHint: string;
  save: string;
  skip: string;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

/**
 * Asked once a freelancer has signed in and has no language pair yet: which
 * languages do they work in, and at what rate. The pair goes into their price
 * list (Settings, Pricing), which is what quoting reads.
 *
 * Skippable. "Not now" (or Escape) closes it for this browser session; it is
 * asked again the next time they sign in, until one pair exists. The rate is
 * optional: left empty the pair starts at `STARTING_RATE`.
 */
export function FirstLanguagesDialog({
  show,
  languages,
  labels,
}: {
  /** Freelancer, may set prices, and the price list has no pair yet. */
  show: boolean;
  languages: readonly { code: string; name_en: string; name_ka: string }[];
  labels: Labels;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SettingsFormState, FormData>(savePairPriceAction, {});
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [rate, setRate] = useState("");

  // The dashboard's "Add your first language pair" button asks for the form
  // again, also after it was dismissed this session.
  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!show) return;
    try {
      if (sessionStorage.getItem(SKIPPED)) return;
    } catch {
      // Storage blocked: ask, and ask again next time.
    }
    setOpen(true);
  }, [show]);

  // Saved: the page re-renders without the prompt, since a pair now exists.
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  const skip = () => {
    try {
      sessionStorage.setItem(SKIPPED, "1");
    } catch {
      // Not remembered: asked again on the next page load.
    }
    setOpen(false);
  };

  const name = (language: { name_en: string; name_ka: string }) =>
    locale === "ka" ? language.name_ka || language.name_en : language.name_en || language.name_ka;
  const errors = state.fieldErrors ?? {};

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else skip();
      }}
    >
      <DialogContent>
        <DialogHeader icon={Languages} hue="blue">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.body}</DialogDescription>
        </DialogHeader>
        <form action={formAction} noValidate className={dialogFormClass}>
          <DialogBody className="space-y-4">
            <FormAlert message={state.error} />
            <input type="hidden" name="is_active" value="on" />
            <input type="hidden" name="price_per_page" value={rate.trim() || STARTING_RATE} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="first_source" label={labels.from} errors={errors.source_language} required>
                <select
                  id="first_source"
                  name="source_language"
                  className={selectClass}
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    if (e.target.value === target) setTarget("");
                  }}
                >
                  <option value="">{labels.pick}</option>
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {name(language)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="first_target" label={labels.to} errors={errors.target_language} required>
                <select
                  id="first_target"
                  name="target_language"
                  className={selectClass}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">{labels.pick}</option>
                  {languages
                    .filter((language) => language.code !== source)
                    .map((language) => (
                      <option key={language.code} value={language.code}>
                        {name(language)}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            <Field
              name="first_rate"
              label={labels.rate}
              errors={errors.price_per_page}
              hint={labels.rateHint}
            >
              <Input
                id="first_rate"
                inputMode="decimal"
                placeholder={STARTING_RATE}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={skip}>
              {labels.skip}
            </Button>
            <Submit label={labels.save} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
/** A button for a server component to put beside the dialog's own prompt. */
export function OpenFirstLanguagesButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="brand"
      size="sm"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {children}
    </Button>
  );
}
