"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ShieldCheck, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { AutoFix, VerificationSummary } from "@/features/translation/types/types.Translation";
import { replaceExactlyOnce } from "@/features/translation/utils/replaceExactlyOnce";

interface Props {
  autoFixes: AutoFix[];
  /** Null for translations that never went through the check. */
  verification?: VerificationSummary | null;
  translatedMarkdown: string;
  onEdit: (content: string) => void;
}

/**
 * What the verification pass changed before delivery. The translation was
 * corrected without asking, so every change is listed and each can be undone
 * -- undo is the same exact-quote replacement the backend made, in reverse.
 */
export default function AutoFixesPanel({ autoFixes, verification, translatedMarkdown, onEdit }: Props) {
  const t = useTranslations("AutoFixes");
  const [open, setOpen] = useState(true);
  const [undone, setUndone] = useState<Set<string>>(new Set());
  const [notFound, setNotFound] = useState<Set<string>>(new Set());

  if (autoFixes.length === 0) {
    // A check that ran and found nothing is worth saying; one that failed or
    // never ran is not something to show the reader.
    if (!verification?.ran) return null;
    return (
      <p className="mb-6 flex items-center gap-2 text-[14px] text-muted-foreground">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600" aria-hidden />
        {verification.handedOn > 0 ? t("handedOn", { count: verification.handedOn }) : t("clean")}
      </p>
    );
  }

  const toggle = (fix: AutoFix) => {
    const isUndone = undone.has(fix.id);
    const next = isUndone
      ? replaceExactlyOnce(translatedMarkdown, fix.originalText, fix.fixedText)
      : replaceExactlyOnce(translatedMarkdown, fix.fixedText, fix.originalText);

    if (next === null) {
      // The text has been edited since, so there is no single place to put it back.
      setNotFound((s) => new Set(s).add(fix.id));
      return;
    }

    onEdit(next);
    setNotFound((s) => {
      const copy = new Set(s);
      copy.delete(fix.id);
      return copy;
    });
    setUndone((s) => {
      const copy = new Set(s);
      if (isUndone) copy.delete(fix.id);
      else copy.add(fix.id);
      return copy;
    });
  };

  const applied = autoFixes.length - undone.size;

  return (
    <section className="mb-6 rounded-xl border border-emerald-600/30 bg-emerald-600/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ShieldCheck className="size-5 shrink-0 text-emerald-600" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{t("title", { count: applied })}</span>
          <span className="block text-[13px] text-muted-foreground">{t("subtitle")}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {autoFixes.map((fix) => {
            const isUndone = undone.has(fix.id);
            return (
              <li key={fix.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("text-[14px] font-semibold", isUndone && "text-muted-foreground line-through")}>
                      {fix.title || t("untitled")}
                    </p>
                    {fix.problem && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{fix.problem}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(fix)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium hover:bg-muted"
                  >
                    {isUndone ? <Redo2 className="size-3.5" aria-hidden /> : <Undo2 className="size-3.5" aria-hidden />}
                    {isUndone ? t("redo") : t("undo")}
                  </button>
                </div>
                <div className="mt-2 grid gap-1 text-[13px] sm:grid-cols-2 sm:gap-3">
                  <p className="rounded bg-red-500/[0.06] px-2 py-1">
                    <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("before")}</span>
                    <span className="line-through decoration-red-500/60">{fix.originalText}</span>
                  </p>
                  <p className="rounded bg-emerald-500/[0.08] px-2 py-1">
                    <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("after")}</span>
                    {fix.fixedText}
                  </p>
                </div>
                {notFound.has(fix.id) && (
                  <p className="mt-2 text-[12px] text-amber-600" role="status">{t("editedSince")}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
