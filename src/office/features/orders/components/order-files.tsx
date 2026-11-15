"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  AlertTriangle,
  ChevronDown,
  Columns2,
  Download,
  EllipsisVertical,
  Folder,
  FolderOpen,
  Kanban,
  Languages,
  Link2,
  List,
  Loader2,
  Lock,
  MoveRight,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import {
  deleteDocumentFileAction,
  loadDocumentFiles,
  loadOrderFilesAction,
  updateDocumentFileAction,
  uploadDocumentFileAction,
  type DocumentFilesState,
} from "@office/features/orders/file-actions";
import { forgetFailedUploads, readFailedUploads } from "@office/features/orders/failed-uploads";
import { fileGlyph } from "@office/features/orders/file-glyph";
import type { DocumentFile, FileKind } from "@office/features/orders/files";
import { LinkFilesDialog } from "@office/features/orders/components/link-files-dialog";
import { SendFilesDialog } from "@office/features/orders/components/send-files-dialog";
import {
  loadTranslationsAction,
  startTranslationAction,
} from "@office/features/orders/translation-actions";
import { isEditableTranslation } from "@office/features/orders/translation-file";
import type { DocumentTranslation } from "@office/features/orders/translations";
import { Link } from "@office/i18n/navigation";
import { selectClass } from "@office/shared/components/form/fields";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { useTimezone } from "@office/shared/components/timezone-context";
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
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@office/shared/components/ui/dropdown-menu";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { formatDate } from "@office/shared/lib/dates";
import { cn, formatFileSize } from "@office/shared/lib/utils";
import { withBasePath } from "@office/shared/lib/base-path";

const KINDS: FileKind[] = ["source", "translation"];
const other = (kind: FileKind): FileKind => (kind === "source" ? "translation" : "source");

/** How often a running translation is asked about. */
const POLL_MS = 4000;
/** What a file dragged inside the panel carries, so a drop can tell it from a file off the desktop. */
const DRAG_TYPE = "application/x-suliko-order-file";

/** Where a translation is corrected, beside its original. */
export const workspaceHref = (orderId: number, documentId: number, fileId: string) =>
  `/translations/${orderId}/documents/${documentId}/translation/${encodeURIComponent(fileId)}`;
/** The same translation in the full-screen editor. */
export const editorHref = (orderId: number, documentId: number, fileId: string) =>
  `/translations/${orderId}/documents/${documentId}/editor/${encodeURIComponent(fileId)}`;
const downloadHref = (orderId: number, documentId: number, fileId: string) =>
  withBasePath(`/api/files/${orderId}/${documentId}/${encodeURIComponent(fileId)}`);

export interface FilesDocument {
  id: number;
  /** "#2 Passport · Georgian → English": what tells it apart in a menu. */
  label: string;
  /** "1 page · Original document · Notarised": the rest of what a document is. */
  detail?: string;
}

/** A file, and the document it belongs to. */
interface Row {
  file: DocumentFile;
  documentId: number;
}

type Section = "all" | FileKind | "translator";
type View = "list" | "board";

const fromTranslator = (file: DocumentFile) => Boolean(file.uploaded_by?.startsWith("portal:"));
/** A translation made by Suliko Translate is read beside its original, and corrected, on a page of its own. */
const editable = isEditableTranslation;

/** "passport.pdf" as its name and its extension, which a rename keeps. */
function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

/**
 * The order's files: every document's Source and Translation in one panel.
 *
 * Modelled on the file browser of the PHP office screen, which staff know by
 * hand: a row of section chips, the files in folders that fold, tick boxes
 * with Send and Remove for what is ticked, and a board where a file is
 * dragged from one section to the other. It replaces a pair of boxes per
 * document, where a file dropped in the wrong box could only be deleted and
 * uploaded again.
 *
 * What differs from that screen is what a file belongs to. There it sat in
 * the order's folder and was linked to a document afterwards; here it belongs
 * to a document from the start. So an upload on an order with several
 * documents asks which one, and a row says whose it is.
 *
 * Suliko Translate stays one click on a source file. While a translation
 * runs the panel asks about it every few seconds, which is also what makes
 * the API fetch the result; the translated file then appears under
 * Translation.
 */
export function OrderFiles({
  orderId,
  clientId,
  documents,
  canWrite,
  topUpUrl,
}: {
  orderId: number;
  clientId: number;
  documents: FilesDocument[];
  canWrite: boolean;
  /** Where pages are bought, offered when a balance does not cover a document. */
  topUpUrl?: string;
}) {
  const t = useTranslations("files");
  const tt = useTranslations("files.translate");
  const tc = useTranslations("common");
  const timeZone = useTimezone();

  const [docs, setDocs] = useState<DocumentFilesState[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>("all");
  const [view, setView] = useState<View>("list");
  const [documentFilter, setDocumentFilter] = useState<number | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [folded, setFolded] = useState<Set<FileKind>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<{ kind: FileKind; done: number; total: number } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [needsTopUp, setNeedsTopUp] = useState(false);
  const [dragOver, setDragOver] = useState<FileKind | null>(null);
  const [renaming, setRenaming] = useState<Row | null>(null);
  const [removing, setRemoving] = useState<Row[] | null>(null);
  const [linking, setLinking] = useState<Row[] | null>(null);
  // Files the order form could not upload after saving (it comes here
  // straight after): said until dismissed, where they can be added again.
  const [notUploaded, setNotUploaded] = useState<string[]>([]);
  useEffect(() => {
    setNotUploaded(readFailedUploads(orderId));
  }, [orderId]);

  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ documentId: number; kind: FileKind } | null>(null);
  // A string, so the loader is made again only when the documents themselves
  // change, not every time the page hands down a new array of the same ones.
  const idsKey = documents.map((doc) => doc.id).join(",");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ids = idsKey ? idsKey.split(",").map(Number) : [];
      const result = await loadOrderFilesAction(orderId, ids);
      if (result.ok) {
        setDocs(result.documents);
        setLoadError(null);
      } else {
        setLoadError(result.error);
      }
    } catch {
      setLoadError(t("errors.unreachable"));
    } finally {
      setLoading(false);
    }
    // `t` is stable for the life of the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, idsKey]);

  // On opening, and again when a document is added to or taken off the order.
  useEffect(() => {
    void load();
  }, [load]);

  // Someone else may have uploaded while this tab was in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const patchDoc = useCallback(
    (documentId: number, change: (doc: DocumentFilesState) => DocumentFilesState) =>
      setDocs((current) => current?.map((doc) => (doc.id === documentId ? change(doc) : doc)) ?? null),
    [],
  );

  // While a translation runs, ask every few seconds. The first answer that
  // says it has finished reloads that document's files, where the result is.
  const runningIds = (docs ?? [])
    .filter((doc) => doc.translations.some((job) => job.status === "processing"))
    .map((doc) => doc.id)
    .join(",");
  useEffect(() => {
    if (!runningIds) return;
    const ids = runningIds.split(",").map(Number);
    const timer = window.setInterval(async () => {
      for (const documentId of ids) {
        const jobs = await loadTranslationsAction(orderId, documentId);
        if (!jobs.ok) continue;
        const still = jobs.translations.some((job) => job.status === "processing");
        if (still) {
          patchDoc(documentId, (doc) => ({ ...doc, translations: jobs.translations }));
          continue;
        }
        if (jobs.translations[0]?.status === "failed") toast.error(tt("failed"));
        else toast.success(tt("done"));
        const files = await loadDocumentFiles(orderId, documentId);
        patchDoc(documentId, (doc) => ({
          ...doc,
          translations: jobs.translations,
          files: files.ok ? files.files : doc.files,
        }));
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
    // `tt` is stable for the life of the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningIds, orderId, patchDoc]);

  const labelOf = useCallback(
    (documentId: number) => documents.find((doc) => doc.id === documentId)?.label ?? "",
    [documents],
  );
  const several = documents.length > 1;

  // Everything the document filter lets through, then what the section chip does.
  const inScope = useMemo<Row[]>(
    () =>
      (docs ?? [])
        .filter((doc) => documentFilter === "all" || doc.id === documentFilter)
        .flatMap((doc) => doc.files.map((file) => ({ file, documentId: doc.id }))),
    [docs, documentFilter],
  );
  const visible = useMemo(
    () =>
      inScope.filter(({ file }) =>
        section === "all" ? true : section === "translator" ? fromTranslator(file) : file.kind === section,
      ),
    [inScope, section],
  );
  const counts: Record<Section, number> = {
    all: inScope.length,
    source: inScope.filter((row) => row.file.kind === "source").length,
    translation: inScope.filter((row) => row.file.kind === "translation").length,
    translator: inScope.filter((row) => fromTranslator(row.file)).length,
  };
  const shownKinds = KINDS.filter((kind) => section === "all" || section === "translator" || section === kind);

  // A tick only counts while its file is still on screen.
  const chosen = visible.filter((row) => selected.has(row.file.id));
  const allChosen = visible.length > 0 && chosen.length === visible.length;

  // The document an upload goes to without asking: the only one, or the one filtered to.
  const uploadDocument =
    documents.length === 1 ? documents[0].id : documentFilter === "all" ? null : documentFilter;

  const mark = (id: string, on: boolean) =>
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  function pickFiles(documentId: number, kind: FileKind) {
    uploadTarget.current = { documentId, kind };
    fileInput.current?.click();
  }

  async function uploadAll(documentId: number, kind: FileKind, list: File[]) {
    if (list.length === 0) return;
    setActionError(null);
    setNeedsTopUp(false);
    setUploading({ kind, done: 0, total: list.length });
    // One at a time: the bytes pass through this server, and the first
    // refusal (too large, storage down) is the one worth reading.
    try {
      for (const [index, file] of list.entries()) {
        const body = new FormData();
        body.set("order_id", String(orderId));
        body.set("document_id", String(documentId));
        body.set("kind", kind);
        body.set("file", file);
        const outcome = await uploadDocumentFileAction(body);
        if (!outcome.ok) {
          setActionError(list.length > 1 ? `${file.name}: ${outcome.error}` : outcome.error);
          break;
        }
        patchDoc(documentId, (doc) => ({ ...doc, files: [...doc.files, outcome.file] }));
        setUploading({ kind, done: index + 1, total: list.length });
      }
    } catch {
      setActionError(t("failed"));
    } finally {
      setUploading(null);
    }
  }

  async function move(row: Row, kind: FileKind) {
    if (row.file.kind === kind) return;
    setActionError(null);
    mark(row.file.id, true);
    try {
      const outcome = await updateDocumentFileAction(orderId, row.documentId, row.file.id, { kind });
      if (!outcome.ok) {
        setActionError(outcome.error);
        return;
      }
      patchDoc(row.documentId, (doc) => ({
        ...doc,
        files: doc.files.map((file) => (file.id === row.file.id ? outcome.file : file)),
      }));
      toast.success(t("moved", { label: t(kind) }));
    } catch {
      setActionError(t("failed"));
    } finally {
      mark(row.file.id, false);
    }
  }

  async function rename(row: Row, name: string): Promise<string | null> {
    try {
      const outcome = await updateDocumentFileAction(orderId, row.documentId, row.file.id, { name });
      if (!outcome.ok) return outcome.error;
      patchDoc(row.documentId, (doc) => ({
        ...doc,
        files: doc.files.map((file) => (file.id === row.file.id ? outcome.file : file)),
      }));
      toast.success(t("renamed"));
      return null;
    } catch {
      return t("failed");
    }
  }

  async function removeAll(rows: Row[]) {
    setActionError(null);
    let removed = 0;
    for (const row of rows) {
      mark(row.file.id, true);
      try {
        const outcome = await deleteDocumentFileAction(orderId, row.documentId, row.file.id);
        if (!outcome.ok) {
          setActionError(rows.length > 1 ? `${row.file.name}: ${outcome.error}` : outcome.error);
          break;
        }
        removed += 1;
        patchDoc(row.documentId, (doc) => ({
          ...doc,
          files: doc.files.filter((file) => file.id !== row.file.id),
        }));
        setSelected((current) => {
          const next = new Set(current);
          next.delete(row.file.id);
          return next;
        });
      } catch {
        setActionError(t("failed"));
        break;
      } finally {
        mark(row.file.id, false);
      }
    }
    if (removed > 0) toast.success(t("removed", { count: removed }));
  }

  async function translate(row: Row) {
    setActionError(null);
    setNeedsTopUp(false);
    mark(`translate:${row.file.id}`, true);
    try {
      const outcome = await startTranslationAction(orderId, row.documentId, row.file.id);
      if (!outcome.ok) {
        setActionError(outcome.error);
        setNeedsTopUp(Boolean(outcome.topUp));
        return;
      }
      const job = outcome.translation;
      patchDoc(row.documentId, (doc) => ({
        ...doc,
        translations: [job, ...doc.translations.filter((item) => item.id !== job.id)],
      }));
      toast.success(
        job.balance === null
          ? tt("started", { pages: job.page_count })
          : tt("startedWithBalance", { pages: job.page_count, balance: Number(job.balance) }),
      );
    } catch {
      setActionError(t("failed"));
    } finally {
      mark(`translate:${row.file.id}`, false);
    }
  }

  // A section takes two kinds of drop: a file dragged from the other
  // section (a move), and files dragged in from the desktop (an upload).
  const dropHandlers = (kind: FileKind) =>
    canWrite
      ? {
          onDragOver: (event: DragEvent) => {
            const types = event.dataTransfer.types;
            if (!types.includes(DRAG_TYPE) && !types.includes("Files")) return;
            event.preventDefault();
            setDragOver(kind);
          },
          onDragLeave: (event: DragEvent) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(null);
          },
          onDrop: (event: DragEvent) => {
            event.preventDefault();
            setDragOver(null);
            const carried = event.dataTransfer.getData(DRAG_TYPE);
            if (carried) {
              const row = inScope.find((item) => item.file.id === carried);
              if (row) void move(row, kind);
              return;
            }
            const dropped = Array.from(event.dataTransfer.files);
            if (dropped.length === 0) return;
            if (uploadDocument === null) {
              setActionError(t("chooseDocumentFirst"));
              return;
            }
            void uploadAll(uploadDocument, kind, dropped);
          },
        }
      : {};

  const dragStart = (row: Row) => (event: DragEvent) => {
    event.dataTransfer.setData(DRAG_TYPE, row.file.id);
    event.dataTransfer.effectAllowed = "move";
  };

  if (docs === null) {
    return loadError ? (
      <div className="px-6 py-5">
        <div className="border-hue-amber-ink/30 bg-hue-amber-tint flex flex-wrap items-start gap-3 rounded-md border px-3 py-2 text-sm">
          <AlertTriangle className="text-hue-amber-ink mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">{loadError}</p>
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t("retry")}
          </Button>
        </div>
      </div>
    ) : (
      <p className="text-muted-foreground flex items-center gap-2 px-6 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden /> {t("opening")}
      </p>
    );
  }

  const jobFor = (row: Row): DocumentTranslation | undefined =>
    docs
      .find((doc) => doc.id === row.documentId)
      ?.translations.find((job) => job.status === "processing" && job.source_file_id === row.file.id);

  const uploadButton = (kind: FileKind) => {
    if (!canWrite) return null;
    const mine = uploading !== null && uploading.kind === kind ? uploading : null;
    const face = (
      <>
        {mine ? <Loader2 className="animate-spin" /> : <Upload />}
        {mine ? t("uploadingN", { done: mine.done, total: mine.total }) : t("upload")}
      </>
    );
    if (uploadDocument !== null) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled={uploading !== null}
          title={t("uploadTo", { label: t(kind) })}
          onClick={() => pickFiles(uploadDocument, kind)}
        >
          {face}
        </Button>
      );
    }
    // Several documents and none picked: the upload asks which one it is for.
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={uploading !== null}>
            {face}
            <ChevronDown className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-80">
          <DropdownMenuLabel>{t("uploadChooseDocument")}</DropdownMenuLabel>
          {documents.map((doc) => (
            <DropdownMenuItem key={doc.id} onSelect={() => pickFiles(doc.id, kind)}>
              <span className="truncate">{doc.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const rowMenu = (row: Row) => {
    if (!canWrite) return null;
    const { file } = row;
    // The vault keeps its own record of a file's name and side: it stays as filed.
    const fixed = file.in_vault === true;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("more", { name: file.name })}
            title={t("more", { name: file.name })}
            disabled={busy.has(file.id)}
          >
            {busy.has(file.id) ? <Loader2 className="animate-spin" /> : <EllipsisVertical />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!fixed && (
            <>
              <DropdownMenuItem onSelect={() => setRenaming(row)}>
                <Pencil /> {t("rename")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void move(row, other(file.kind))}>
                <MoveRight /> {t("moveTo", { label: t(other(file.kind)) })}
              </DropdownMenuItem>
            </>
          )}
          {/* The vault keeps a file's name and side, not its document: a
              vaulted file can be linked like any other. */}
          {several && (
            <DropdownMenuItem onSelect={() => setLinking([row])}>
              <Link2 /> {t("link")}
            </DropdownMenuItem>
          )}
          {(!fixed || several) && <DropdownMenuSeparator />}
          <DropdownMenuItem variant="destructive" onSelect={() => setRemoving([row])}>
            <Trash2 /> {t("removeOne")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /** Open beside the original, download, or say that only the vault has it. */
  const openActions = (row: Row) => {
    const { file } = row;
    return (
      <>
        {editable(file) && file.downloadable !== false && (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label={tt("open", { name: file.name })}
            title={tt("open", { name: file.name })}
          >
            <Link href={workspaceHref(orderId, row.documentId, file.id)}>
              <Columns2 />
            </Link>
          </Button>
        )}
        {file.downloadable === false ? (
          // Only the Order Vault has it now (the download copy goes when the
          // order closes): there is nothing to download from here.
          <span
            role="img"
            className="text-muted-foreground flex size-8 shrink-0 items-center justify-center"
            title={t("inVault", { order: file.vault_order ?? "?" })}
            aria-label={t("inVault", { order: file.vault_order ?? "?" })}
          >
            <Lock className="size-4" />
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label={t("download", { name: file.name })}
            title={t("download", { name: file.name })}
          >
            <a href={downloadHref(orderId, row.documentId, file.id)}>
              <Download />
            </a>
          </Button>
        )}
      </>
    );
  };

  /** Whose file it is and where it came from, in one grey line. */
  const provenance = (row: Row) =>
    [
      several && documentFilter === "all" ? labelOf(row.documentId) : null,
      fromTranslator(row.file) ? t("fromTranslator") : null,
      row.file.uploaded_by?.startsWith("suliko:") ? tt("bySuliko") : null,
      row.file.uploaded_by?.startsWith("claude:") ? tt("byClaude") : null,
    ].filter(Boolean);

  const translateLine = (row: Row) => {
    if (!canWrite || row.file.kind !== "source" || row.file.downloadable === false) return null;
    const job = jobFor(row);
    const starting = busy.has(`translate:${row.file.id}`);
    return job || starting ? (
      <p
        role="status"
        className="text-hue-violet-ink flex items-center gap-1.5 px-1 text-xs font-medium whitespace-nowrap"
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {job ? tt("running", { progress: job.progress ?? 0 }) : tt("starting")}
      </p>
    ) : (
      <Button
        variant="outline"
        size="sm"
        title={tt("hint")}
        aria-label={tt("button")}
        data-tip="order-translate-send"
        onClick={() => void translate(row)}
      >
        <Languages className="text-hue-violet-ink" />
        <span className="sr-only @xl:not-sr-only">{tt("button")}</span>
      </Button>
    );
  };

  const chips: { key: Section; label: string }[] = [
    { key: "all", label: tc("all") },
    { key: "source", label: t("source") },
    { key: "translation", label: t("translation") },
    // Only worth a chip once a translator has sent something in.
    ...(counts.translator > 0 || section === "translator"
      ? [{ key: "translator" as const, label: t("fromTranslatorTab") }]
      : []),
  ];

  return (
    // A container: the panel sits in a column whose width depends on the
    // sidebar as much as on the screen, so "is there room for two board
    // columns, or for a label on this button" is asked of the panel.
    <div className="@container">
      <input
        ref={fileInput}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const list = Array.from(event.target.files ?? []);
          const target = uploadTarget.current;
          event.target.value = "";
          if (target) void uploadAll(target.documentId, target.kind, list);
        }}
      />

      {notUploaded.length > 0 && (
        <div
          role="alert"
          className="border-hue-red-ink/30 bg-hue-red-tint mx-4 mb-3 flex items-start gap-3 rounded-md border px-3 py-2 text-sm sm:mx-6"
        >
          <AlertTriangle className="text-hue-red-ink mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t("notUploadedTitle", { count: notUploaded.length })}</p>
            <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
              {notUploaded.map((line) => (
                <li key={line} className="break-words">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tc("close")}
            title={tc("close")}
            onClick={() => {
              forgetFailedUploads(orderId);
              setNotUploaded([]);
            }}
          >
            <X />
          </Button>
        </div>
      )}

      {/* Which files: the section, the document, and how to look at them. */}
      <div className="border-border bg-muted/40 flex flex-wrap items-center gap-2 border-y px-4 py-2.5 sm:px-6">
        <div role="group" aria-label={t("section")} className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <ToggleChip
              key={chip.key}
              pressed={section === chip.key}
              onClick={() => setSection(chip.key)}
              className={cn(
                "flex h-8 items-center gap-1.5 px-3 text-xs font-medium",
                section !== chip.key && "bg-background",
              )}
            >
              {chip.label}
              <span className="tabular-nums opacity-70">{counts[chip.key]}</span>
            </ToggleChip>
          ))}
        </div>

        {several && (
          <select
            aria-label={t("document")}
            className={cn(selectClass, "h-8 w-auto max-w-56 text-xs")}
            value={documentFilter}
            onChange={(event) =>
              setDocumentFilter(event.target.value === "all" ? "all" : Number(event.target.value))
            }
          >
            <option value="all">{t("allDocuments")}</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.label}
              </option>
            ))}
          </select>
        )}

        <div role="group" aria-label={t("view")} className="ml-auto flex gap-1">
          {(
            [
              ["list", List, t("viewList")],
              ["board", Kanban, t("viewBoard")],
            ] as const
          ).map(([key, Icon, label]) => (
            <ToggleChip
              key={key}
              pressed={view === key}
              onClick={() => setView(key)}
              title={label}
              className={cn(
                "flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium",
                view !== key && "bg-background",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="max-sm:sr-only">{label}</span>
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* What is ticked, and what to do with it. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
        {view === "list" && visible.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={allChosen}
              onCheckedChange={(state) =>
                setSelected(state === true ? new Set(visible.map((row) => row.file.id)) : new Set())
              }
            />
            {chosen.length > 0 ? t("selectedCount", { count: chosen.length }) : t("selectAll")}
          </label>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canWrite && chosen.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setRemoving(chosen)}
            >
              <Trash2 /> {t("removeMany", { count: chosen.length })}
            </Button>
          )}
          {canWrite && several && visible.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinking(chosen.length > 0 ? chosen : visible)}
            >
              <Link2 /> {chosen.length > 0 ? t("linkMany", { count: chosen.length }) : t("linkAll")}
            </Button>
          )}
          {canWrite && inScope.length > 0 && (
            <SendFilesDialog
              orderId={orderId}
              clientId={clientId}
              documents={documents}
              preselect={chosen.map((row) => row.file.id)}
            />
          )}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="text-destructive px-4 pb-3 text-sm sm:px-6">
          {actionError}
          {needsTopUp && topUpUrl && (
            <>
              {" "}
              <a
                href={topUpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link font-medium whitespace-nowrap hover:underline"
              >
                {tt("topUp")}
              </a>
            </>
          )}
        </p>
      )}

      {view === "list" ? (
        <div className="border-border border-t">
          {shownKinds.map((kind) => {
            const rows = visible.filter((row) => row.file.kind === kind);
            const open = !folded.has(kind);
            const Mark = open ? FolderOpen : Folder;
            return (
              <section
                key={kind}
                {...dropHandlers(kind)}
                className={cn(
                  "border-border border-b last:border-b-0",
                  dragOver === kind && "bg-hue-blue-tint/60 outline-suliko-default-color outline-2 -outline-offset-2 outline-dashed",
                )}
              >
                <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setFolded((current) => {
                        const next = new Set(current);
                        if (next.has(kind)) next.delete(kind);
                        else next.add(kind);
                        return next;
                      })
                    }
                    className="focus-visible:ring-ring/50 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm py-1 text-left text-sm font-medium outline-none focus-visible:ring-[3px]"
                  >
                    <ChevronDown
                      className={cn("text-muted-foreground size-4 shrink-0 transition-transform", !open && "-rotate-90")}
                      aria-hidden
                    />
                    <Mark className="text-hue-amber-ink size-4 shrink-0" aria-hidden />
                    {t(kind)}
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal tabular-nums">
                      {rows.length}
                    </span>
                    <span className="text-muted-foreground hidden truncate text-xs font-normal lg:inline">
                      {t(`${kind}Hint`)}
                    </span>
                  </button>
                  {uploadButton(kind)}
                </div>

                {open &&
                  (rows.length === 0 ? (
                    <p className="text-muted-foreground px-4 pb-4 pl-12 text-xs sm:px-6 sm:pl-14">
                      {canWrite ? t("dropToUpload") : t("empty")}
                    </p>
                  ) : (
                    <ul className="divide-border divide-y">
                      {rows.map((row) => {
                        const { file } = row;
                        const { icon: Icon, ink } = fileGlyph(file.name, file.content_type);
                        const picked = selected.has(file.id);
                        const notes = [
                          formatFileSize(file.size_bytes),
                          formatDate(file.created_at, timeZone),
                          ...provenance(row),
                        ];
                        return (
                          <li
                            key={file.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 text-sm sm:px-6",
                              picked && "bg-hue-blue-tint/40",
                            )}
                          >
                            <Checkbox
                              checked={picked}
                              aria-label={t("select", { name: file.name })}
                              onCheckedChange={(state) =>
                                setSelected((current) => {
                                  const next = new Set(current);
                                  if (state === true) next.add(file.id);
                                  else next.delete(file.id);
                                  return next;
                                })
                              }
                            />
                            <Icon className={cn("size-5 shrink-0", ink)} aria-hidden />
                            <span className="min-w-0 flex-1">
                              {file.downloadable === false ? (
                                <span className="block truncate" title={file.name}>
                                  {file.name}
                                </span>
                              ) : editable(file) ? (
                                <Link
                                  href={workspaceHref(orderId, row.documentId, file.id)}
                                  title={file.name}
                                  className="hover:text-link block truncate hover:underline"
                                >
                                  {file.name}
                                </Link>
                              ) : (
                                <a
                                  href={downloadHref(orderId, row.documentId, file.id)}
                                  title={file.name}
                                  className="hover:text-link block truncate hover:underline"
                                >
                                  {file.name}
                                </a>
                              )}
                              {/* Size, date, whose it is: one grey line. Columns
                                  for the first two left the name a hundred
                                  pixels on a laptop. */}
                              <span className="text-muted-foreground block truncate text-xs">
                                {notes.join(" · ")}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5">
                              {translateLine(row)}
                              {openActions(row)}
                              {rowMenu(row)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ))}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="border-border border-t px-4 py-4 sm:px-6">
          <div className="grid gap-3 @xl:grid-cols-2">
            {shownKinds.map((kind) => {
              const rows = visible.filter((row) => row.file.kind === kind);
              return (
                <section
                  key={kind}
                  {...dropHandlers(kind)}
                  className={cn(
                    "border-border bg-muted/30 flex min-h-40 flex-col rounded-lg border",
                    dragOver === kind && "border-suliko-default-color bg-hue-blue-tint/60 border-dashed",
                  )}
                >
                  <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
                    <h3 className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      <span className="truncate">{t(kind)}</span>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal tabular-nums">
                        {rows.length}
                      </span>
                    </h3>
                    {uploadButton(kind)}
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-muted-foreground m-auto px-3 py-6 text-center text-xs">
                      {canWrite ? t("dropToUpload") : t("empty")}
                    </p>
                  ) : (
                    <ul className="space-y-2 p-2">
                      {rows.map((row) => {
                        const { file } = row;
                        const { icon: Icon, ink } = fileGlyph(file.name, file.content_type);
                        const notes = provenance(row);
                        const movable = canWrite && file.in_vault !== true;
                        return (
                          <li
                            key={file.id}
                            draggable={movable}
                            onDragStart={movable ? dragStart(row) : undefined}
                            className={cn(
                              "bg-card border-border flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm shadow-xs",
                              movable && "cursor-grab active:cursor-grabbing",
                              busy.has(file.id) && "opacity-60",
                            )}
                          >
                            <Icon className={cn("size-5 shrink-0", ink)} aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-muted-foreground block truncate text-xs">
                                {[formatFileSize(file.size_bytes), ...notes].join(" · ")}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5">
                              {openActions(row)}
                              {rowMenu(row)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
          {canWrite && <p className="text-muted-foreground mt-3 text-xs">{t("boardHint")}</p>}
        </div>
      )}

      {renaming && (
        <RenameDialog
          // A new dialog for each file, so the field starts from its name.
          key={renaming.file.id}
          row={renaming}
          onClose={() => setRenaming(null)}
          onRename={rename}
        />
      )}

      {linking && (
        <LinkFilesDialog
          // Opened afresh for each set of files, so every choice starts from where the file is.
          key={linking.map((row) => row.file.id).join(",")}
          orderId={orderId}
          documents={documents}
          rows={linking}
          onClose={() => setLinking(null)}
          onLinked={(count) => {
            setLinking(null);
            toast.success(t("linked", { count }));
            void load();
          }}
        />
      )}

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader icon={Trash2} hue="red">
            <DialogTitle className="break-words">
              {removing?.length === 1
                ? t("removeTitleOne", { name: removing[0].file.name })
                : t("removeTitleMany", { count: removing?.length ?? 0 })}
            </DialogTitle>
            <DialogDescription>{t("removeBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRemoving(null)}>
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const rows = removing ?? [];
                setRemoving(null);
                void removeAll(rows);
              }}
            >
              <Trash2 /> {t("removeOne")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RenameDialog({
  row,
  onClose,
  onRename,
}: {
  row: Row;
  onClose: () => void;
  /** Resolves to what went wrong, or null when the name was changed. */
  onRename: (row: Row, name: string) => Promise<string | null>;
}) {
  const t = useTranslations("files");
  const tc = useTranslations("common");
  const [base, extension] = splitName(row.file.name);
  const [name, setName] = useState(base);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Pencil} hue="blue">
          <DialogTitle>{t("renameTitle")}</DialogTitle>
          <DialogDescription className="break-all">{row.file.name}</DialogDescription>
        </DialogHeader>
        <form
          className={dialogFormClass}
          onSubmit={async (event) => {
            event.preventDefault();
            const wanted = name.trim();
            if (!wanted || wanted === base) return onClose();
            setSaving(true);
            setError(null);
            const failure = await onRename(row, `${wanted}${extension}`);
            setSaving(false);
            if (failure) setError(failure);
            else onClose();
          }}
        >
          <DialogBody className="space-y-2">
            <Label htmlFor="file-name">{t("renameLabel")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                autoFocus
                aria-invalid={error ? true : undefined}
              />
              {/* The extension is not for changing: the bytes are what they were. */}
              {extension && <span className="text-muted-foreground shrink-0 text-sm">{extension}</span>}
            </div>
            {error && (
              <p role="alert" className="text-destructive text-xs">
                {error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              {tc("cancel")}
            </Button>
            <Button type="submit" variant="brand" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="animate-spin" /> : <Pencil />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
