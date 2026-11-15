"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  Award,
  Baby,
  Check,
  ClipboardList,
  Cpu,
  FileSignature,
  FileText,
  Gavel,
  GraduationCap,
  HeartHandshake,
  IdCard,
  Landmark,
  Loader2,
  Mail,
  Save,
  ScrollText,
  Stethoscope,
  BookUser,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  chooseDocumentTypesAction,
  type SettingsFormState,
} from "@office/features/settings/actions";
import { FormAlert } from "@office/shared/components/form/fields";
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
import { cn } from "@office/shared/lib/utils";

const SKIPPED = "suliko:document-types-skipped";
const OPEN_EVENT = "suliko:open-document-types";

/**
 * One icon per starter document type, found by its English name (the seeded
 * catalogue). A type someone added themselves gets the plain document icon.
 */
const ICONS: Record<string, LucideIcon> = {
  passport: BookUser,
  "id card": IdCard,
  "birth certificate": Baby,
  "marriage certificate": HeartHandshake,
  diploma: GraduationCap,
  transcript: ClipboardList,
  certificate: Award,
  "power of attorney": ScrollText,
  contract: FileSignature,
  letter: Mail,
  "technical specifications": Cpu,
  "medical record": Stethoscope,
  "bank statement": Landmark,
  "court document": Gavel,
};
const iconFor = (nameEn: string): LucideIcon =>
  ICONS[nameEn.trim().toLowerCase()] ?? FileText;

interface Labels {
  title: string;
  body: string;
  selectAll: string;
  clearAll: string;
  /** "{count} selected": the number is put in where {count} is. */
  count: string;
  save: string;
  skip: string;
}

function Submit({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending || disabled}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

/**
 * Asked of a freelancer who has a price list but no document type switched on:
 * which kinds of document do they translate?
 *
 * Everything starts ticked, so the common answer ("all of them") is one click;
 * they untick what they do not do. Saved in one go (`chooseDocumentTypesAction`).
 * Skippable, like the language prompt: closed for this browser session and
 * asked again at the next sign-in until one type is on. The checklist's button
 * reopens it.
 */
export function DocumentTypesDialog({
  show,
  types,
  labels,
}: {
  show: boolean;
  types: readonly { id: number; name_en: string; name_ka: string }[];
  labels: Labels;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    chooseDocumentTypesAction,
    {},
  );
  const [chosen, setChosen] = useState<Set<number>>(
    () => new Set(types.map((type) => type.id)),
  );

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

  // Saved: the page re-renders with the step ticked off.
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

  const toggle = (id: number) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const name = (type: { name_en: string; name_ka: string }) =>
    locale === "ka"
      ? type.name_ka || type.name_en
      : type.name_en || type.name_ka;
  const sorted = [...types].sort((a, b) =>
    name(a).localeCompare(name(b), locale),
  );
  const allChosen = chosen.size === types.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else skip();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader icon={FileText} hue="teal">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.body}</DialogDescription>
        </DialogHeader>
        <form action={formAction} noValidate className={dialogFormClass}>
          <DialogBody className="space-y-3">
            <FormAlert message={state.error} />
            {[...chosen].map((id) => (
              <input key={id} type="hidden" name="type_id" value={id} />
            ))}
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground" aria-live="polite">
                {labels.count.replace("{count}", String(chosen.size))}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setChosen(
                    allChosen
                      ? new Set()
                      : new Set(types.map((type) => type.id)),
                  )
                }
              >
                {allChosen ? labels.clearAll : labels.selectAll}
              </Button>
            </div>
            <ul className="grid max-h-[60vh] gap-2 overflow-y-auto p-0.5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((type) => {
                const on = chosen.has(type.id);
                const Icon = iconFor(type.name_en);
                return (
                  <li key={type.id}>
                    <label
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
                        on
                          ? "border-suliko-default-color bg-suliko-default-color/5"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(type.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-md transition-colors",
                          on
                            ? "bg-suliko-default-color/15 text-suliko-default-color"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        {name(type)}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                          on
                            ? "border-suliko-default-color bg-suliko-default-color text-white"
                            : "border-border text-transparent",
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={skip}>
              {labels.skip}
            </Button>
            <Submit label={labels.save} disabled={chosen.size === 0} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A button for a server component to put beside the checklist step. */
export function OpenDocumentTypesButton({
  children,
}: {
  children: React.ReactNode;
}) {
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
