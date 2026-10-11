"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Languages,
  Loader2,
  PenLine,
  Upload,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  fetchAssignedOrder,
  fileDownloadUrl,
  uploadTranslation,
  type OrdersLoad,
  type TranslationUpload,
} from "@/features/orders/api";
import { isTranslatable, translateHref } from "@/features/orders/orderSource";
import {
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
    <div className="container mx-auto p-6 max-w-3xl">
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

      {result?.status === "ok" && <OrderDetail order={result.data} onChanged={reload} />}
    </div>
  );
}

function OrderDetail({
  order,
  onChanged,
}: {
  order: AssignedOrderDetail;
  onChanged: () => void;
}) {
  const t = useTranslations("Orders");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t("order", { id: order.order_number ?? "" })}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-8">
        {t("bureau")}: {order.organization.name} · {t("client")}: {order.client_name} ·{" "}
        {t("ordered")}: {order.order_date} ·{" "}
        {order.due_date ? `${t("due")}: ${order.due_date}` : t("noDue")}
      </p>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        {t("documents")}
      </h2>
      <ul className="space-y-3">
        {order.documents.map((document) => (
          <li key={document.id}>
            <DocumentCard order={order} document={document} onChanged={onChanged} />
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
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  onChanged: () => void;
}) {
  const t = useTranslations("Orders");
  const slug = order.organization.slug;
  const orderId = order.order_id;
  const documentId = document.id;

  // The translations this person made of this document's files on this site,
  // newest first. Kept in the browser, so read once the page is up.
  const [made, setMade] = useState<OrderTranslationNote[]>([]);
  useEffect(() => {
    setMade(translationsOfDocument(slug, orderId, documentId));
  }, [slug, orderId, documentId]);

  return (
    <Card className="p-4 border border-border/60">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {document.document_type_name ?? t("documents")} ·{" "}
            <span className="uppercase">{document.source_language}</span> →{" "}
            <span className="uppercase">{document.target_language}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("pages", { count: document.page_count })}
          </p>

          <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">{t("files")}</p>
          {document.files_state === "unavailable" ? (
            <p className="text-xs text-muted-foreground">{t("filesUnavailable")}</p>
          ) : (
            <>
              {document.files.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noFiles")}</p>
              ) : (
                <ul className="space-y-2">
                  {document.files.map((file) => (
                    <FileRow
                      key={file.id}
                      order={order}
                      document={document}
                      file={file}
                      made={made.find((note) => note.fileId === file.id) ?? null}
                    />
                  ))}
                </ul>
              )}
              <UploadTranslation
                slug={slug}
                orderId={orderId}
                documentId={documentId}
                onUploaded={onChanged}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function FileRow({
  order,
  document,
  file,
  made,
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  file: OrderFile;
  /** This person's latest translation of the file on this site, if any. */
  made: OrderTranslationNote | null;
}) {
  const t = useTranslations("Orders");
  // Only what the bureau sent is translated, and only what the document screen reads.
  const translatable = file.kind === "source" && file.downloadable && isTranslatable(file.name);
  return (
    // On a phone the name has the line to itself and the actions sit under
    // it: beside them it would be squeezed to nothing.
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="min-w-0 basis-full truncate sm:basis-0 sm:flex-1">
        {file.name}
        <span className="text-xs text-muted-foreground">
          {" "}
          {formatSize(file.size_bytes)} · {file.uploaded_by_me ? t("mine") : t("fromBureau")}
        </span>
      </span>
      {made && (
        <Link
          href={`/translations/${made.chatId}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
        >
          <PenLine className="h-4 w-4" />
          {t("openTranslation")}
        </Link>
      )}
      {translatable && (
        // The ordinary document screen, with this file in it.
        <Link
          href={translateHref({
            slug: order.organization.slug,
            orderId: order.order_id,
            documentId: document.id,
            fileId: file.id,
          })}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
        >
          <Languages className="h-4 w-4" />
          {made ? t("translateAgain") : t("translate")}
        </Link>
      )}
      {file.downloadable ? (
        // A plain link: the server answers with a redirect to the file itself.
        <a
          href={fileDownloadUrl(order.organization.slug, order.order_id, document.id, file.id)}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
        >
          <Download className="h-4 w-4" />
          {t("download")}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground shrink-0">{t("fileGone")}</span>
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
    <div className="mt-3">
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
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer disabled:cursor-default disabled:opacity-70 disabled:no-underline"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? t("uploading") : t("upload")}
      </button>
      {problem && (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {t(UPLOAD_PROBLEM_KEYS[problem])}
        </p>
      )}
    </div>
  );
}
