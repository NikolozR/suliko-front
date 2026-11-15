"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Link2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { linkFilesAction } from "@office/features/orders/file-actions";
import type { FilesDocument } from "@office/features/orders/components/order-files";
import { selectClass } from "@office/shared/components/form/fields";
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

/** A file and the document it is on now. */
export interface LinkRow {
  file: { id: string; name: string };
  documentId: number;
}

/**
 * "Link files to documents": which document of the order each file belongs to.
 *
 * Documents of one order can have different language pairs. A file is
 * translated, and shown to the translator, as part of the document it is on,
 * so a file on the wrong one has to be moved. Every file shows the document it
 * is on now; only the ones changed are sent, in one request that moves all of
 * them or none.
 *
 * The documents are named by what tells them apart (number, type, languages,
 * pages, copy), because an order of four passports in one language pair would
 * otherwise offer four identical choices.
 */
export function LinkFilesDialog({
  orderId,
  documents,
  rows,
  onClose,
  onLinked,
}: {
  orderId: number;
  documents: FilesDocument[];
  rows: LinkRow[];
  onClose: () => void;
  /** How many files moved. */
  onLinked: (count: number) => void;
}) {
  const t = useTranslations("files");
  const tc = useTranslations("common");
  const [target, setTarget] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((row) => [row.file.id, row.documentId])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = rows.filter((row) => target[row.file.id] !== row.documentId);
  const optionText = (doc: FilesDocument) =>
    [doc.label, doc.detail].filter(Boolean).join(" · ");

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const result = await linkFilesAction(
        orderId,
        changed.map((row) => ({
          fileId: row.file.id,
          documentId: target[row.file.id],
        })),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLinked(result.moved);
    } catch {
      setError(t("failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader icon={Link2} hue="blue">
          <DialogTitle>{t("linkTitle")}</DialogTitle>
          <DialogDescription>{t("linkBody")}</DialogDescription>
        </DialogHeader>
        <form
          className={dialogFormClass}
          onSubmit={(event) => {
            event.preventDefault();
            if (changed.length > 0) void submit();
          }}
        >
          <DialogBody className="space-y-3">
            <ul className="divide-border border-border max-h-[50vh] divide-y overflow-y-auto rounded-md border">
              {rows.map((row) => {
                const id = `link-${row.file.id}`;
                const moved = target[row.file.id] !== row.documentId;
                return (
                  <li
                    key={row.file.id}
                    className={cn(
                      "grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-3",
                      moved && "bg-hue-blue-tint/40",
                    )}
                  >
                    <label htmlFor={id} className="min-w-0 text-sm break-words">
                      <span className="text-muted-foreground block text-xs">
                        {t("linkFile")}
                      </span>
                      {row.file.name}
                    </label>
                    <div className="min-w-0 space-y-1">
                      <select
                        id={id}
                        className={selectClass}
                        // The whole name, for when the box is too narrow to show it.
                        title={optionText(
                          documents.find(
                            (doc) => doc.id === target[row.file.id],
                          ) ?? documents[0],
                        )}
                        value={target[row.file.id]}
                        disabled={saving}
                        onChange={(event) =>
                          setTarget((current) => ({
                            ...current,
                            [row.file.id]: Number(event.target.value),
                          }))
                        }
                      >
                        {documents.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.label}
                          </option>
                        ))}
                      </select>
                      {/* The rest of what the document is (pages, copy type), written out
                        below: in the dropdown it was cut off on a narrow screen. */}
                      <p className="text-muted-foreground text-xs">
                        {
                          documents.find(
                            (doc) => doc.id === target[row.file.id],
                          )?.detail
                        }
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {error && (
              <p
                role="alert"
                className="text-destructive flex items-start gap-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={saving || changed.length === 0}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Link2 />}
              {changed.length > 0
                ? t("linkSubmit", { count: changed.length })
                : t("linkNothing")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
