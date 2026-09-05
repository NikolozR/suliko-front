"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { getProjectNames } from "@/features/projects";
import { prepareDocumentUpload } from "@/features/translation/services/prepareUploadService";
import { DEFAULT_DOCUMENT_OUTPUT_FORMAT } from "@/features/translation/types/types.Translation";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";
import {
  Batch,
  CreateBatchItemRequest,
  DocumentSettings,
  StagedDocument,
} from "../types/types.Bulk";
import {
  FolderScanResult,
  RejectionReason,
  resolveMimeType,
} from "../utils/folderScanning";
import { countPagesForFile } from "../utils/pageCounting";
import {
  PAGE_COUNT_CONCURRENCY,
  runWithConcurrency,
  UPLOAD_CONCURRENCY,
} from "../utils/uploadPool";
import { createBatch, getBatch } from "../services/batchService";
import { FolderDropZone } from "./FolderDropZone";
import { BulkDocumentTable } from "./BulkDocumentTable";
import { BulkApplyPanel } from "./BulkApplyPanel";
import { BatchProgressView } from "./BatchProgressView";

interface BulkTranslationPanelProps {
  projectId: string;
  projectName: string;
}

/** Message keys for why a file was left out, resolved through next-intl at render time. */
const REJECTION_KEYS: Record<RejectionReason, string> = {
  unsupported: "reasonUnsupported",
  subtitles: "reasonSubtitles",
  "too-large": "reasonTooLarge",
  empty: "reasonEmpty",
};

/** Gemini's default; the model is not exposed per document, only the language pair is. */
const DEFAULT_MODEL = 2;

const defaultSettings = (
  glossary: NameTranslationItem[]
): DocumentSettings => ({
  targetLanguageId: 0,
  sourceLanguageId: 0,
  outputFormat: DEFAULT_DOCUMENT_OUTPUT_FORMAT,
  model: DEFAULT_MODEL,
  instructions: "",
  nameTranslations: glossary,
});

export function BulkTranslationPanel({
  projectId,
  projectName,
}: BulkTranslationPanelProps) {
  const [documents, setDocuments] = useState<StagedDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<FolderScanResult["rejected"]>([]);
  const [glossary, setGlossary] = useState<NameTranslationItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const t = useTranslations("BulkTranslation");

  // Seed every document from the project's saved glossary so names stay consistent with
  // translations already filed in this project, without the user re-entering them.
  useEffect(() => {
    getProjectNames(projectId)
      .then((names) =>
        setGlossary(
          names.map(({ original, translation, type }) => ({
            original,
            translation,
            type,
          }))
        )
      )
      .catch(() => setGlossary([]));
  }, [projectId]);

  const handleFilesSelected = (result: FolderScanResult) => {
    setRejected(result.rejected);

    if (result.accepted.length === 0) {
      if (result.rejected.length > 0) {
        toast.error(t("noneTranslatable"));
      }
      return;
    }

    const staged: StagedDocument[] = result.accepted.map((entry, index) => ({
      id: `${Date.now()}-${index}-${entry.relativePath}`,
      file: entry.file,
      relativePath: entry.relativePath,
      pageCount: null,
      settings: defaultSettings(glossary),
      upload: { status: "idle", progress: 0 },
    }));

    setDocuments(staged);
    setSelectedIds(new Set());
    void resolvePageCounts(staged);
  };

  /**
   * Page counts drive both the price and the time estimate. Resolved in the background so
   * the list appears immediately rather than after every file has been inspected.
   */
  const resolvePageCounts = useCallback(async (staged: StagedDocument[]) => {
    await runWithConcurrency(staged, PAGE_COUNT_CONCURRENCY, async (doc) => {
      const pageCount = await countPagesForFile(doc.file);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, pageCount } : d))
      );
    });
  }, []);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === documents.length
        ? new Set()
        : new Set(documents.map((d) => d.id))
    );
  };

  const updateSettings = (id: string, patch: Partial<DocumentSettings>) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, settings: { ...doc.settings, ...patch } } : doc
      )
    );
  };

  const applyToSelected = (patch: Partial<DocumentSettings>) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        selectedIds.has(doc.id)
          ? { ...doc, settings: { ...doc.settings, ...patch } }
          : doc
      )
    );
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const missingTargetLanguage = documents.filter(
    (doc) => doc.settings.targetLanguageId === 0
  );

  const handleSubmit = async () => {
    if (missingTargetLanguage.length > 0) {
      toast.error(t("needsTargetLanguage", { count: missingTargetLanguage.length }));
      return;
    }

    setSubmitting(true);

    try {
      // Upload first, then queue. The backend only ever receives file URIs, so a batch can
      // never be created referencing bytes that failed to reach Google.
      const uploaded = await uploadAll();
      const usable = uploaded.filter((doc) => doc.upload.fileUri);

      if (usable.length === 0) {
        toast.error(t("noUploads"));
        return;
      }

      if (usable.length < uploaded.length) {
        toast.error(
          t("someUploadsFailed", { count: uploaded.length - usable.length }),
          { duration: 5000 }
        );
      }

      const items: CreateBatchItemRequest[] = usable.map((doc) => ({
        fileName: doc.file.name,
        relativePath: doc.relativePath,
        fileUri: doc.upload.fileUri!,
        mimeType: doc.upload.mimeType || resolveMimeType(doc.file),
        pageCount: doc.pageCount ?? 1,
        targetLanguageId: doc.settings.targetLanguageId,
        outputLanguageId: doc.settings.targetLanguageId,
        // 0 is the UI's "detect automatically"; the API expects null for that.
        sourceLanguageId:
          doc.settings.sourceLanguageId === 0
            ? null
            : doc.settings.sourceLanguageId,
        outputFormat: doc.settings.outputFormat,
        model: doc.settings.model,
        instructions: doc.settings.instructions.trim() || null,
        nameTranslations: doc.settings.nameTranslations.filter((n) =>
          n.original.trim()
        ),
      }));

      const response = await createBatch({
        projectId,
        name: deriveBatchName(usable),
        items,
      });

      setBatch(response.data);
      setDocuments([]);
      setSelectedIds(new Set());
      toast.success(t("queuedToast", { count: items.length }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("queueFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Uploads every staged file straight to Google, a few at a time, updating each row's
   * progress as it goes. Returns the documents with their upload state resolved.
   */
  const uploadAll = async (): Promise<StagedDocument[]> => {
    const current = documents;

    setDocuments((prev) =>
      prev.map((doc) => ({
        ...doc,
        upload: { status: "uploading", progress: 0 },
      }))
    );

    return runWithConcurrency(current, UPLOAD_CONCURRENCY, async (doc) => {
      try {
        const result = await prepareDocumentUpload(doc.file, {
          onProgress: (fraction) =>
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id
                  ? { ...d, upload: { ...d.upload, progress: fraction } }
                  : d
              )
            ),
        });

        const upload: StagedDocument["upload"] = {
          status: "uploaded",
          progress: 1,
          fileUri: result.fileUri,
          mimeType: result.mimeType,
        };

        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, upload } : d))
        );

        return { ...doc, upload };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";

        const upload: StagedDocument["upload"] = {
          status: "error",
          progress: 0,
          error: message,
        };

        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, upload } : d))
        );

        // One bad file must not abort the folder; it is reported and skipped.
        return { ...doc, upload };
      }
    });
  };

  const refreshBatch = useCallback(async () => {
    if (!batch) return;
    try {
      const response = await getBatch(batch.id);
      setBatch(response.data);
    } catch {
      // Transient polling failures are not worth interrupting the user over.
    }
  }, [batch]);

  useBatchPolling(batch, refreshBatch);

  if (batch) {
    return (
      <div className="space-y-5">
        <BatchProgressView
          batch={batch}
          projectName={projectName}
          onChanged={refreshBatch}
        />
        <Button variant="outline" onClick={() => setBatch(null)}>
          {t("translateAnother")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {documents.length === 0 && (
        <FolderDropZone onFilesSelected={handleFilesSelected} disabled={submitting} />
      )}

      {rejected.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs dark:border-amber-800/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {t("filesSkipped", { count: rejected.length })}
            </p>
            <ul className="space-y-0.5 text-amber-700 dark:text-amber-400">
              {rejected.slice(0, 5).map((file) => (
                <li key={file.relativePath}>
                  {file.name} — {t(REJECTION_KEYS[file.reason])}
                </li>
              ))}
              {rejected.length > 5 && (
                <li>{t("andMore", { count: rejected.length - 5 })}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <>
          {selectedIds.size > 0 && (
            <BulkApplyPanel
              selectedCount={selectedIds.size}
              onApply={applyToSelected}
              disabled={submitting}
            />
          )}

          <BulkDocumentTable
            documents={documents}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onToggleAll={toggleAll}
            onUpdateSettings={updateSettings}
            onRemove={removeDocument}
            disabled={submitting}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {missingTargetLanguage.length > 0
                ? t("needsTargetLanguage", { count: missingTargetLanguage.length })
                : t("readySummary", {
                    count: documents.length,
                    pages: totalPages(documents),
                  })}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDocuments([]);
                  setSelectedIds(new Set());
                  setRejected([]);
                }}
                disabled={submitting}
              >
                {t("clear")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || missingTargetLanguage.length > 0}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {submitting
                  ? t("uploading")
                  : t("translateCount", { count: documents.length })}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const totalPages = (documents: StagedDocument[]) =>
  documents.reduce((sum, doc) => sum + (doc.pageCount ?? 0), 0);

/** Names the batch after the folder the documents came from, when there is one. */
const deriveBatchName = (documents: StagedDocument[]): string | null => {
  const first = documents[0]?.relativePath ?? "";
  const root = first.includes("/") ? first.split("/")[0] : null;
  return root;
};

/**
 * Polls while work is outstanding and stops once the batch settles, so a finished batch
 * left open in a tab does not keep hitting the API indefinitely.
 */
function useBatchPolling(batch: Batch | null, refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const active =
    !!batch &&
    batch.status !== "Completed" &&
    batch.status !== "CompletedWithErrors" &&
    batch.status !== "Cancelled";

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => refreshRef.current(), 4000);
    return () => window.clearInterval(id);
  }, [active]);
}
