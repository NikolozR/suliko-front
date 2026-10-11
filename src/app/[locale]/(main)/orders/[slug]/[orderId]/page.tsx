"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  File as FileIcon,
  FileImage,
  FileText,
  Languages,
  Loader2,
  PenLine,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/features/ui/components/ui/button";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  fetchAssignedOrder,
  fileDownloadUrl,
  removeTranslation,
  uploadTranslation,
  type OrdersLoad,
  type TranslationRemoval,
  type TranslationUpload,
} from "@/features/orders/api";
import { DueBadge, StatusChip } from "@/features/orders/components/OrderBadges";
import {
  OrderFilePreview,
  isPreviewable,
  type PreviewTarget,
} from "@/features/orders/components/OrderFilePreview";
import {
  formatDate,
  languageName,
  parseDay,
  type DocumentStatus,
} from "@/features/orders/display";
import { countPagesUnopened, useOrderFilePages } from "@/features/orders/orderFilePages";
import { isTranslatable, translateHref } from "@/features/orders/orderSource";
import {
  noteRemovedFromOrder,
  translationsOfDocument,
  type OrderTranslationNote,
} from "@/features/orders/orderTranslations";
import type {
  AssignedDocumentDetail,
  AssignedOrderDetail,
  OrderFile,
} from "@/features/orders/types";

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A translation this translator has added to the document: what makes it "sent". */
const handedIn = (file: OrderFile) => file.uploaded_by_me && file.kind === "translation";

/** One assigned order: only the documents given to this translator, and their files. */
export default function AssignedOrderPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);
  const t = useTranslations("Orders");
  const tTitles = useTranslations("PageTitles");
  useDocumentTitle(tTitles("orders"));
  const [result, setResult] = useState<OrdersLoad<AssignedOrderDetail> | null>(null);
  // The file being looked at: beside the order on a wide screen, over it on a phone.
  const [previewed, setPreviewed] = useState<PreviewTarget | null>(null);
  const closePreview = useCallback(() => setPreviewed(null), []);

  useEffect(() => {
    let cancelled = false;
    fetchAssignedOrder(slug, orderId).then((loaded) => {
      if (!cancelled) setResult(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, orderId]);

  // After a translation has been added: the same order again, for its new file.
  // A failed reload keeps what is on screen rather than replacing it with an error.
  const reload = useCallback(() => {
    fetchAssignedOrder(slug, orderId).then((loaded) => {
      if (loaded.status === "ok") setResult(loaded);
    });
  }, [slug, orderId]);

  return (
    // Wider while a file is open, so the order keeps its width beside it.
    <div className={cn("container mx-auto p-6", previewed ? "max-w-6xl" : "max-w-3xl")}>
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      {result === null && <Skeleton className="h-24 w-full" aria-label={t("loading")} />}

      {result && result.status !== "ok" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            {result.status === "notFound"
              ? t("notFound")
              : result.status === "unavailable"
                ? t("unavailable")
                : result.status === "notTranslator"
                  ? t("notLinkedTitle")
                  : result.status === "signedOut"
                    ? t("signedOut")
                    : t("error")}
          </p>
        </div>
      )}

      {result?.status === "ok" && (
        <div
          className={cn(
            previewed && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-6",
          )}
        >
          <div className="min-w-0">
            <OrderDetail
              order={result.data}
              onChanged={reload}
              previewedFileId={previewed?.file.id ?? null}
              onPreview={setPreviewed}
            />
          </div>
          {previewed && <OrderFilePreview target={previewed} onClose={closePreview} />}
        </div>
      )}
    </div>
  );
}

type PreviewControls = {
  /** The file open in the preview, if any. */
  previewedFileId: string | null;
  /** Open a file in the preview, or close it with null. */
  onPreview: (target: PreviewTarget | null) => void;
};

function OrderDetail({
  order,
  onChanged,
  ...preview
}: {
  order: AssignedOrderDetail;
  onChanged: () => void;
} & PreviewControls) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const day = (value: string) => {
    const date = parseDay(value);
    return date ? formatDate(date, locale) : value;
  };
  // Nothing left to hurry once every document has a translation handed in.
  const allSent =
    order.documents.length > 0 && order.documents.every((document) => document.files.some(handedIn));

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("order", { id: order.order_number ?? "" })}</h1>
        <DueBadge dueDate={order.due_date} done={allSent} />
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-8">
        {t("bureau")}: {order.organization.name} · {t("client")}: {order.client_name} ·{" "}
        {t("ordered")}: {day(order.order_date)}
        {order.due_date ? ` · ${t("due")}: ${day(order.due_date)}` : ""}
      </p>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        {t("documents")}
      </h2>
      <ul className="space-y-3">
        {order.documents.map((document) => (
          <li key={document.id}>
            <DocumentCard order={order} document={document} onChanged={onChanged} {...preview} />
          </li>
        ))}
      </ul>
    </>
  );
}

function DocumentCard({
  order,
  document,
  onChanged,
  ...preview
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  onChanged: () => void;
} & PreviewControls) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const slug = order.organization.slug;
  const orderId = order.order_id;
  const documentId = document.id;

  // The translations this person made of this document's files on this site,
  // newest first. Kept in the browser, so read once the page is up.
  const [made, setMade] = useState<OrderTranslationNote[]>([]);
  useEffect(() => {
    setMade(translationsOfDocument(slug, orderId, documentId));
  }, [slug, orderId, documentId]);

  // How many pages its small PDFs really have, one file after another.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const file of document.files) {
        if (cancelled) return;
        await countPagesUnopened(slug, orderId, documentId, file);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, orderId, documentId, document.files]);

  // Sent: a translation is in the order. In progress: one was started on this
  // site, as far as this browser knows, and nothing has been handed in yet.
  const status: DocumentStatus = document.files.some(handedIn)
    ? "sent"
    : made.length > 0
      ? "inProgress"
      : "notStarted";

  // What came in and what went out, apart: whose a file is decides what can be done with it.
  const fromBureau = document.files.filter((file) => !file.uploaded_by_me);
  const mine = document.files.filter((file) => file.uploaded_by_me);
  const row = (file: OrderFile) => (
    <FileRow
      key={file.id}
      order={order}
      document={document}
      file={file}
      made={made.find((note) => note.fileId === file.id) ?? null}
      onRemoved={onChanged}
      {...preview}
    />
  );

  return (
    <Card className="p-4 border border-border/60">
      {/* On a phone the status drops under the name rather than squeezing it. */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 basis-40">
          <p className="font-medium">
            {document.document_type_name ?? t("documents")} ·{" "}
            {languageName(document.source_language, locale)} →{" "}
            {languageName(document.target_language, locale)}
          </p>
          {/* The bureau's figure, said to be the order's: a file's own count is beside the file. */}
          <p className="text-xs text-muted-foreground mt-1">
            {t("pagesInOrder", { count: document.page_count })}
          </p>
        </div>
        <StatusChip status={status} />
      </div>

      {document.files_state === "unavailable" ? (
        <p className="mt-4 text-xs text-muted-foreground">{t("filesUnavailable")}</p>
      ) : (
        <>
          <FileGroup label={t("fromBureau")}>
            {fromBureau.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noFiles")}</p>
            ) : (
              <ul className="space-y-2">{fromBureau.map(row)}</ul>
            )}
          </FileGroup>
          <FileGroup label={t("yourTranslations")}>
            {mine.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("nothingSent")}</p>
            ) : (
              <ul className="space-y-2">{mine.map(row)}</ul>
            )}
            <UploadTranslation
              slug={slug}
              orderId={orderId}
              documentId={documentId}
              onUploaded={onChanged}
            />
          </FileGroup>
        </>
      )}
    </Card>
  );
}

function FileGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{label}</h3>
      {children}
    </section>
  );
}

/** A small action that is all icon: named for a screen reader and on hover. */
const ICON_ACTION = "text-muted-foreground hover:bg-muted hover:text-foreground";

function FileRow({
  order,
  document,
  file,
  made,
  onRemoved,
  previewedFileId,
  onPreview,
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  file: OrderFile;
  /** This person's latest translation of the file on this site, if any. */
  made: OrderTranslationNote | null;
  onRemoved: () => void;
} & PreviewControls) {
  const t = useTranslations("Orders");
  const slug = order.organization.slug;
  // Only what the bureau sent is translated, and only what the document screen reads.
  const translate =
    file.kind === "source" && file.downloadable && isTranslatable(file.name)
      ? translateHref({ slug, orderId: order.order_id, documentId: document.id, fileId: file.id })
      : null;
  // Only a translation this person added: what the bureau sent or added is the bureau's.
  const removable = file.kind === "translation" && file.uploaded_by_me;
  const previewable = isPreviewable(file);
  const previewed = previewedFileId === file.id;
  // The file's own page count, where this browser has read it (PDFs).
  const pages = useOrderFilePages((state) => state.pages[file.id]);
  const preview = () =>
    onPreview(
      previewed
        ? null
        : { slug, orderId: order.order_id, documentId: document.id, file, translateHref: translate },
    );

  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [problem, setProblem] = useState<Exclude<TranslationRemoval["status"], "ok"> | null>(null);

  const remove = async () => {
    setRemoving(true);
    setProblem(null);
    const result = await removeTranslation(slug, order.order_id, document.id, file.id);
    setRemoving(false);
    setConfirming(false);
    if (result.status === "ok") {
      // The translation it was sent from, if any, no longer says "sent".
      noteRemovedFromOrder(slug, order.order_id, document.id, file.name);
      if (previewed) onPreview(null);
      onRemoved();
    } else {
      setProblem(result.status);
    }
  };

  const Kind = /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)
    ? FileImage
    : /\.(pdf|docx?|txt|srt|md|rtf|odt)$/i.test(file.name)
      ? FileText
      : FileIcon;

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
        previewed ? "border-suliko-default-color bg-suliko-default-color/[0.04]" : "border-border/60",
      )}
    >
      {/* On a phone the name has the line to itself and the actions sit under it. */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
        <div className="flex min-w-0 basis-full items-center gap-2.5 py-1.5 sm:basis-0 sm:flex-1">
          <Kind className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            {previewable ? (
              <button
                type="button"
                onClick={preview}
                className="block max-w-full truncate text-left hover:underline cursor-pointer"
              >
                {file.name}
              </button>
            ) : (
              <p className="truncate">{file.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatSize(file.size_bytes)}
              {pages ? ` · ${t("pages", { count: pages })}` : ""}
            </p>
          </div>
        </div>

        {previewable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={preview}
            aria-label={t("preview")}
            aria-pressed={previewed}
            title={t("preview")}
            className={cn(ICON_ACTION, previewed && "text-suliko-default-color")}
          >
            <Eye />
          </Button>
        )}
        {file.downloadable ? (
          // A plain link: the server answers with a redirect to the file itself.
          <Button asChild variant="ghost" size="icon" className={ICON_ACTION}>
            <a
              href={fileDownloadUrl(slug, order.order_id, document.id, file.id)}
              aria-label={t("download")}
              title={t("download")}
            >
              <Download />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">{t("fileGone")}</span>
        )}
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setConfirming(true)}
            aria-label={t("remove")}
            title={t("remove")}
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 />
          </Button>
        )}
      </div>

      {translate && (
        // The one thing to do with a bureau's file. Once done here, the
        // translation itself is the next step, and doing it over is the lesser one.
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-1.5 pt-1">
          {made ? (
            <>
              <Button asChild size="sm">
                <Link href={`/translations/${made.chatId}`}>
                  <PenLine />
                  {t("openTranslation")}
                </Link>
              </Button>
              <Link href={translate} className="text-sm text-primary hover:underline">
                {t("translateAgain")}
              </Link>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href={translate}>
                <Languages />
                {t("translate")}
              </Link>
            </Button>
          )}
        </div>
      )}

      {problem && (
        <p role="alert" className="pb-1.5 text-xs text-red-600 dark:text-red-400">
          {t(
            problem === "notMine"
              ? "removeNotMine"
              : problem === "signedOut"
                ? "removeSignedOut"
                : "removeError",
          )}
        </p>
      )}
      {removable && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={(open) => !removing && setConfirming(open)}
          title={t("removeTitle")}
          description={t("removeBody", { name: file.name, bureau: order.organization.name })}
          confirmLabel={t("remove")}
          onConfirm={remove}
          loading={removing}
        />
      )}
    </li>
  );
}

const UPLOAD_PROBLEM_KEYS: Record<Exclude<TranslationUpload["status"], "ok">, string> = {
  tooLarge: "sendTooLarge",
  gone: "sendGone",
  signedOut: "sendSignedOut",
  error: "sendError",
};

/** A translation finished somewhere else (Word, a CAT tool), added to the document. */
function UploadTranslation({
  slug,
  orderId,
  documentId,
  onUploaded,
}: {
  slug: string;
  orderId: number;
  documentId: number;
  onUploaded: () => void;
}) {
  const t = useTranslations("Orders");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<keyof typeof UPLOAD_PROBLEM_KEYS | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setProblem(null);
    const result = await uploadTranslation(slug, orderId, documentId, file);
    setBusy(false);
    if (result.status === "ok") onUploaded();
    else setProblem(result.status);
  };

  return (
    <div className="mt-2">
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared so that choosing the same file again is still a change.
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? t("uploading") : t("upload")}
      </Button>
      {problem && (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {t(UPLOAD_PROBLEM_KEYS[problem])}
        </p>
      )}
    </div>
  );
}
