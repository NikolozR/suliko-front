"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Languages, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { ClaudePickableFile } from "@office/features/orders/claude";
import { loadClaudeFilesAction, startClaudeJobsAction } from "@office/features/orders/claude-actions";
import { Badge } from "@office/shared/components/ui/badge";
import { Button } from "@office/shared/components/ui/button";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import { formatFileSize } from "@office/shared/lib/utils";

export interface ClaudeDocument {
  id: number;
  /** What the files panel calls it: "Passport · Georgian → English". */
  label: string;
}

type Loaded = { files: ClaudePickableFile[]; instructions: string | null };

const isActive = (file: ClaudePickableFile) =>
  file.job_status === "queued" || file.job_status === "translating";

/**
 * "Translate by Claude": the order's source files with checkboxes. Only the
 * ticked ones become jobs; nothing is translated when a file is merely
 * uploaded. A file that is already waiting cannot be ticked again, and one
 * that already has a Claude translation needs an extra confirmation (the old
 * translation is kept: the new one is added beside it).
 *
 * Everything is loaded when the dialog opens and thrown away when it closes,
 * so it always shows the files as they are now.
 */
export function ClaudeTranslateDialog({
  orderId,
  documents,
  onStarted,
}: {
  orderId: number;
  documents: ClaudeDocument[];
  /** Called after jobs were queued, so the panel can show them at once. */
  onStarted: () => void;
}) {
  const t = useTranslations("claudeTranslate");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" size="sm" data-tip="order-claude-translate">
          <Sparkles /> {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader icon={Languages} hue="violet">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open && (
          <PickForm
            orderId={orderId}
            documents={documents}
            onDone={(started) => {
              setOpen(false);
              if (started) onStarted();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickForm({
  orderId,
  documents,
  onDone,
}: {
  orderId: number;
  documents: ClaudeDocument[];
  onDone: (started: boolean) => void;
}) {
  const t = useTranslations("claudeTranslate");
  const tCommon = useTranslations("common");

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [again, setAgain] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadClaudeFilesAction(orderId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setLoadError(result.error);
          return;
        }
        setLoaded({ files: result.files, instructions: result.instructions });
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("errors.unavailable"));
      });
    return () => {
      cancelled = true;
    };
    // Loaded once per opening: the form is unmounted when the dialog closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loadError) {
    return (
      <DialogBody>
        <p role="alert" className="text-destructive text-sm">
          {loadError}
        </p>
      </DialogBody>
    );
  }
  if (!loaded) {
    return (
      <DialogBody>
        <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {t("loading")}
        </p>
      </DialogBody>
    );
  }

  // A file can be ticked unless it cannot be sent at all or is already with Claude.
  const pickable = loaded.files.filter((file) => file.downloadable && !isActive(file));
  const chosen = loaded.files.filter((file) => selected.has(file.id));
  const needsConfirmation = chosen.some((file) => file.has_output);
  const canStart = !starting && chosen.length > 0 && (!needsConfirmation || again);
  const groups = documents
    .map((doc) => ({ doc, files: loaded.files.filter((file) => file.document_id === doc.id) }))
    .filter((group) => group.files.length > 0);

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const result = await startClaudeJobsAction({
        orderId,
        fileIds: chosen.map((file) => file.id),
        confirmRetranslate: again,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("started", { count: result.jobs.length }));
      onDone(true);
    } catch {
      setError(t("errors.unavailable"));
    } finally {
      setStarting(false);
    }
  }

  return (
    <form
      className={dialogFormClass}
      onSubmit={(event) => {
        event.preventDefault();
        if (canStart) void start();
      }}
    >
      <DialogBody className="space-y-5">
        <fieldset className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-medium">{t("files")}</legend>
            {pickable.length > 0 && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set(pickable.map((file) => file.id)))}
                >
                  {t("selectAll")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                >
                  {t("selectNone")}
                </Button>
              </div>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noFiles")}</p>
          ) : (
            groups.map(({ doc, files }) => (
              <div key={doc.id} className="space-y-1.5">
                {/* The language pair the translation will be made in, per document. */}
                <p className="text-muted-foreground text-xs">
                  {doc.label} · {t("willTranslate")}{" "}
                  <span className="text-foreground font-medium uppercase">
                    {files[0].source_language} → {files[0].target_language}
                  </span>
                </p>
                <ul className="border-border divide-border divide-y rounded-md border">
                  {files.map((file) => {
                    const inputId = `claude-file-${file.id}`;
                    const locked = !file.downloadable || isActive(file);
                    return (
                      <li key={file.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          id={inputId}
                          checked={selected.has(file.id)}
                          disabled={locked}
                          onCheckedChange={(state) => toggle(file.id, state === true)}
                        />
                        <label htmlFor={inputId} className="min-w-0 flex-1 text-sm">
                          <span className="block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {file.content_type.split("/")[1]?.toUpperCase() ?? file.content_type}
                            {" · "}
                            {formatFileSize(file.size_bytes)}
                            {!file.downloadable && ` · ${t("inVault")}`}
                          </span>
                        </label>
                        {isActive(file) ? (
                          <Badge variant="outline">{t(`status.${file.job_status ?? "queued"}`)}</Badge>
                        ) : file.has_output ? (
                          <Badge variant="secondary">{t("hasOutput")}</Badge>
                        ) : file.job_status === "failed" ? (
                          <Badge variant="outline" className="text-hue-red-ink">
                            {t("status.failed")}
                          </Badge>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </fieldset>

        {loaded.instructions ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("instructions")}</p>
            <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-xs whitespace-pre-wrap">
              {loaded.instructions}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">{t("noInstructions")}</p>
        )}

        {needsConfirmation && (
          <label className="border-hue-amber-ink/30 bg-hue-amber-tint flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <Checkbox
              checked={again}
              onCheckedChange={(state) => setAgain(state === true)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <AlertTriangle className="text-hue-amber-ink mr-1 inline size-4" aria-hidden />
              {t("translateAgain")}
            </span>
          </label>
        )}

        <p className="text-muted-foreground text-xs">{t("draftNote")}</p>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onDone(false)}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={!canStart}>
          {starting ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {starting ? t("starting") : t("submit", { count: chosen.length })}
        </Button>
      </DialogFooter>
    </form>
  );
}
