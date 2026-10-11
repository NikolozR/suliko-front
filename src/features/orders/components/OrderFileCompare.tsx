"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import DocumentPreview from "@/features/translation/components/DocumentPreview";
import { useOrderFile } from "../orderFileBytes";
import type { OrderFile } from "../types";

export type CompareTarget = {
  slug: string;
  orderId: number;
  documentId: number;
  documentName: string | null;
  /** What the bureau sent, and what the translator added: the ones that can be shown. */
  originals: OrderFile[];
  translations: OrderFile[];
  /** Which of each to open with. */
  originalId: string;
  translationId: string;
};

type Side = "original" | "translation";

/**
 * A bureau's file and the translator's translation of it, next to each other:
 * the last look before the bureau takes its own. Side by side on a wide
 * screen; on a phone one at a time, with a switch between them.
 */
export function OrderFileCompare({ target, onClose }: { target: CompareTarget; onClose: () => void }) {
  const t = useTranslations("Orders");
  const [originalId, setOriginalId] = useState(target.originalId);
  const [translationId, setTranslationId] = useState(target.translationId);
  // Which one a narrow screen shows. The translation: it is what is being checked.
  const [shown, setShown] = useState<Side>("translation");

  const original = target.originals.find((file) => file.id === originalId) ?? target.originals[0];
  const translation =
    target.translations.find((file) => file.id === translationId) ?? target.translations[0];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // Nothing to describe beyond the title.
        aria-describedby={undefined}
        className="left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
      >
        <header className="flex items-center gap-2 border-b border-border/60 py-1 pl-4 pr-1">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
            {t("compareTitle")}
            {target.documentName ? ` · ${target.documentName}` : ""}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("closeCompare")}
              title={t("closeCompare")}
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X />
            </Button>
          </DialogClose>
        </header>

        {/* A phone has room for one of them. */}
        <div role="tablist" aria-label={t("compareTitle")} className="flex gap-2 border-b border-border/60 p-2 md:hidden">
          {(["original", "translation"] as const).map((side) => (
            <button
              key={side}
              type="button"
              role="tab"
              aria-selected={shown === side}
              onClick={() => setShown(side)}
              className={cn(
                "h-11 flex-1 rounded-md text-sm font-medium transition-colors",
                shown === side ? "bg-suliko-default-color text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {t(side)}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-2">
          <Pane
            target={target}
            label={t("original")}
            files={target.originals}
            file={original}
            onPick={setOriginalId}
            className={cn(shown !== "original" && "hidden md:flex")}
          />
          <Pane
            target={target}
            label={t("translation")}
            files={target.translations}
            file={translation}
            onPick={setTranslationId}
            className={cn(shown !== "translation" && "hidden md:flex")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Pane({
  target,
  label,
  files,
  file,
  onPick,
  className,
}: {
  target: CompareTarget;
  label: string;
  /** Every file that could stand on this side: more than one gets a choice. */
  files: OrderFile[];
  file: OrderFile;
  onPick: (fileId: string) => void;
  className?: string;
}) {
  const t = useTranslations("Orders");
  const loaded = useOrderFile(target.slug, target.orderId, target.documentId, file);

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)} aria-label={label}>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="shrink-0 font-medium">{label}</span>
        {files.length > 1 ? (
          <select
            value={file.id}
            onChange={(event) => onPick(event.target.value)}
            aria-label={label}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
          >
            {files.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{file.name}</span>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {loaded.status === "loading" ? (
          <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("previewLoading")}
          </div>
        ) : loaded.status === "failed" ? (
          <div role="alert" className="flex h-full items-center justify-center gap-2 px-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("previewFailed")}
          </div>
        ) : (
          <div className="h-full">
            <DocumentPreview file={loaded.file} trackPageCount={false} />
          </div>
        )}
      </div>
    </section>
  );
}
