"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Link2, Link2Off, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import DocumentPreview, {
  PreviewScrollerContext,
  type PreviewScroller,
} from "@/features/translation/components/DocumentPreview";
import { formatDate } from "../display";
import { useOrderFile, type OrderFileBytes } from "../orderFileBytes";
import { useScrollTogether } from "../scrollTogether";
import type { OrderFile } from "../types";
import { OrderTranslationEditor, editableSourceOf, type EditableSource } from "./OrderTranslationEditor";

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

type ReportScroller = (scroller: PreviewScroller | null) => void;

/**
 * A bureau's file and the translator's translation of it, next to each other:
 * the last look before the bureau takes its own. Side by side on a wide
 * screen; on a phone one at a time, with a switch between them. The two scroll
 * together, and a translation written by this site can be corrected in place.
 */
export function OrderFileCompare({
  target,
  onClose,
  onReplaced,
}: {
  target: CompareTarget;
  onClose: () => void;
  /**
   * A translation was corrected here: `added` is in the order now, and the
   * file it was made from is gone from it unless `earlierRemoved` is false.
   */
  onReplaced: (earlierId: string, added: OrderFile, earlierRemoved: boolean) => void;
}) {
  const t = useTranslations("Orders");
  const [originalId, setOriginalId] = useState(target.originalId);
  const [translationId, setTranslationId] = useState(target.translationId);
  // Which one a narrow screen shows. The translation: it is what is being checked.
  const [shown, setShown] = useState<Side>("translation");
  const scroll = useScrollTogether();
  // Corrections not saved to the order yet: closing asks first.
  const [unsaved, setUnsaved] = useState(false);
  const [closing, setClosing] = useState(false);

  const original = target.originals.find((file) => file.id === originalId) ?? target.originals[0];
  const translation =
    target.translations.find((file) => file.id === translationId) ?? target.translations[0];

  return (
    <Dialog open onOpenChange={(open) => !open && (unsaved ? setClosing(true) : onClose())}>
      <DialogContent
        // Nothing to describe beyond the title.
        aria-describedby={undefined}
        className="left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
      >
        <header className="flex items-center gap-1 border-b border-border/60 py-1 pl-4 pr-1">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
            {t("compareTitle")}
            {target.documentName ? ` · ${target.documentName}` : ""}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={scroll.together}
            aria-label={t("scrollTogether")}
            title={t("scrollTogether")}
            onClick={scroll.toggle}
            className={cn(
              "shrink-0 hover:bg-muted",
              scroll.together
                ? "text-accent-text hover:text-accent-text"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {scroll.together ? <Link2 aria-hidden /> : <Link2Off aria-hidden />}
            <span className="hidden sm:inline">{t("scrollTogether")}</span>
          </Button>
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

        {/*
          On a phone the two lie in the same place and one is out of sight. Out
          of sight, not gone: it keeps its width and its place in the text, and
          follows the one being scrolled, so the switch lands on the same spot.
        */}
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3 p-3 md:grid-cols-2">
          <OriginalPane
            target={target}
            file={original}
            onPick={setOriginalId}
            onScroller={scroll.reportFirst}
            className={cn(shown !== "original" && "invisible md:visible")}
          />
          <TranslationPane
            target={target}
            file={translation}
            onPick={setTranslationId}
            onScroller={scroll.reportSecond}
            onEdited={setUnsaved}
            onReplaced={(added, earlierRemoved) => {
              setTranslationId(added.id);
              onReplaced(translation.id, added, earlierRemoved);
            }}
            className={cn(shown !== "translation" && "invisible md:visible")}
          />
        </div>

        <ConfirmDialog
          open={closing}
          onOpenChange={setClosing}
          title={t("discardTitle")}
          description={t("discardBody")}
          confirmLabel={t("discard")}
          onConfirm={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function OriginalPane({
  target,
  file,
  onPick,
  onScroller,
  className,
}: {
  target: CompareTarget;
  file: OrderFile;
  onPick: (fileId: string) => void;
  onScroller: ReportScroller;
  className?: string;
}) {
  const t = useTranslations("Orders");
  const loaded = useOrderFile(target.slug, target.orderId, target.documentId, file);

  return (
    <Pane
      label={t("original")}
      className={className}
      head={<FileChoice label={t("original")} files={target.originals} file={file} onPick={onPick} />}
    >
      <FileView loaded={loaded} onScroller={onScroller} />
    </Pane>
  );
}

function TranslationPane({
  target,
  file,
  onPick,
  onScroller,
  onEdited,
  onReplaced,
  className,
}: {
  target: CompareTarget;
  file: OrderFile;
  onPick: (fileId: string) => void;
  onScroller: ReportScroller;
  onEdited: (edited: boolean) => void;
  onReplaced: (added: OrderFile, earlierRemoved: boolean) => void;
  className?: string;
}) {
  const t = useTranslations("Orders");
  const loaded = useOrderFile(target.slug, target.orderId, target.documentId, file);
  const bytes = loaded.status === "ok" ? loaded.file : null;

  // What the file is opened from, where it is a file that can be corrected here.
  const [opened, setOpened] = useState<{ of: File; source: EditableSource | null } | null>(null);
  useEffect(() => {
    if (!bytes) return;
    let cancelled = false;
    editableSourceOf(bytes).then((source) => {
      if (!cancelled) setOpened({ of: bytes, source });
    });
    return () => {
      cancelled = true;
    };
  }, [bytes]);
  const editable = bytes && opened?.of === bytes ? opened.source : null;

  // Which file is open for corrections.
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editable !== null && editingId === file.id;

  return (
    <Pane
      label={t("translation")}
      className={className}
      head={
        <>
          <FileChoice
            label={t("translation")}
            files={target.translations}
            file={file}
            onPick={onPick}
            // One file at a time: the one being corrected stays.
            disabled={editing}
          />
          {editable !== null && !editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingId(file.id)}
              className="shrink-0"
            >
              <Pencil aria-hidden />
              {t("edit")}
            </Button>
          )}
        </>
      }
    >
      {editing ? (
        <OrderTranslationEditor
          slug={target.slug}
          orderId={target.orderId}
          documentId={target.documentId}
          file={file}
          source={editable}
          onScroller={onScroller}
          onEdited={onEdited}
          onCancel={() => setEditingId(null)}
          onSaved={(added, earlierRemoved) => {
            setEditingId(null);
            onReplaced(added, earlierRemoved);
          }}
        />
      ) : (
        <FileView loaded={loaded} onScroller={onScroller} />
      )}
    </Pane>
  );
}

/** One side: what it is and which file, over the file itself. */
function Pane({
  label,
  head,
  className,
  children,
}: {
  label: string;
  head: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col md:col-start-auto md:row-start-auto",
        className,
      )}
    >
      <div className="mb-2 flex min-h-11 items-center gap-2 text-sm">
        <span className="shrink-0 font-medium">{label}</span>
        {head}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/**
 * A file's name, with when it was added where another file bears the same
 * name: a translation sent twice, or corrected here, keeps its name.
 */
function nameAmong(file: OrderFile, files: OrderFile[], locale: string): string {
  if (!files.some((other) => other.id !== file.id && other.name === file.name)) return file.name;
  const added = file.created_at ? new Date(file.created_at) : null;
  if (!added || Number.isNaN(added.getTime())) return file.name;
  const time = [added.getHours(), added.getMinutes()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return `${file.name} · ${formatDate(added, locale)}, ${time}`;
}

/** Which file stands on a side: a choice where there is more than one. */
function FileChoice({
  label,
  files,
  file,
  onPick,
  disabled,
}: {
  label: string;
  files: OrderFile[];
  file: OrderFile;
  onPick: (fileId: string) => void;
  disabled?: boolean;
}) {
  const locale = useLocale();
  if (files.length < 2) {
    return <span className="min-w-0 flex-1 truncate text-muted-foreground">{file.name}</span>;
  }
  return (
    <select
      value={file.id}
      onChange={(event) => onPick(event.target.value)}
      aria-label={label}
      disabled={disabled}
      className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
    >
      {files.map((option) => (
        <option key={option.id} value={option.id}>
          {nameAmong(option, files, locale)}
        </option>
      ))}
    </select>
  );
}

/** The file as the viewer draws it, which says where it scrolls. */
function FileView({ loaded, onScroller }: { loaded: OrderFileBytes; onScroller: ReportScroller }) {
  const t = useTranslations("Orders");
  if (loaded.status === "loading") {
    return (
      <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("previewLoading")}
      </div>
    );
  }
  if (loaded.status === "failed") {
    return (
      <div role="alert" className="flex h-full items-center justify-center gap-2 px-4 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        {t("previewFailed")}
      </div>
    );
  }
  return (
    <PreviewScrollerContext.Provider value={onScroller}>
      <div className="h-full">
        <DocumentPreview file={loaded.file} trackPageCount={false} />
      </div>
    </PreviewScrollerContext.Provider>
  );
}
