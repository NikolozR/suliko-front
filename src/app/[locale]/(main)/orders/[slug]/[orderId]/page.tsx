"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Download, FileText, Languages, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  fetchAssignedOrder,
  fetchTranslations,
  fileDownloadUrl,
  type OrdersLoad,
} from "@/features/orders/api";
import {
  TranslateFileDialog,
  type TranslateTarget,
} from "@/features/orders/components/TranslateFileDialog";
import type {
  AssignedDocumentDetail,
  AssignedOrderDetail,
  OrderFile,
  OrderTranslation,
} from "@/features/orders/types";

/** How often a running translation is asked about. */
const POLL_MS = 3000;

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

  // After a translation has been filed: the same order again, for its new file.
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
  const [target, setTarget] = useState<TranslateTarget | null>(null);
  // A job the dialog has just started, handed to its document's card.
  const [started, setStarted] = useState<{ documentId: number; job: OrderTranslation } | null>(
    null,
  );

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
            <DocumentCard
              order={order}
              document={document}
              started={started?.documentId === document.id ? started.job : null}
              onTranslate={(file) =>
                setTarget({
                  slug: order.organization.slug,
                  orderId: order.order_id,
                  documentId: document.id,
                  fileId: file.id,
                  fileName: file.name,
                })
              }
              onChanged={onChanged}
            />
          </li>
        ))}
      </ul>

      <TranslateFileDialog
        target={target}
        onClose={() => setTarget(null)}
        onStarted={(documentId, job) => setStarted({ documentId, job })}
      />
    </>
  );
}

function DocumentCard({
  order,
  document,
  started,
  onTranslate,
  onChanged,
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  /** A job started a moment ago from the dialog, before the order is read again. */
  started: OrderTranslation | null;
  onTranslate: (file: OrderFile) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Orders");
  const slug = order.organization.slug;
  const orderId = order.order_id;
  const documentId = document.id;

  // The translator's own Suliko Translate jobs on this document, newest first.
  const [jobs, setJobs] = useState<OrderTranslation[]>(document.translations ?? []);
  useEffect(() => {
    setJobs(document.translations ?? []);
  }, [document.translations]);
  useEffect(() => {
    if (started) setJobs((known) => [started, ...known.filter((job) => job.id !== started.id)]);
  }, [started]);

  // While one runs, ask how far it is. Asking is also what files the result:
  // the Office API has no worker of its own. Once nothing runs any more, the
  // order is read again, for the new file.
  const running = jobs.some((job) => job.status === "processing");
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const look = async () => {
      const loaded = await fetchTranslations(slug, orderId, documentId);
      if (cancelled) return;
      if (loaded.status === "ok") {
        setJobs(loaded.data);
        if (!loaded.data.some((job) => job.status === "processing")) {
          onChanged();
          return;
        }
      }
      timer = setTimeout(look, POLL_MS);
    };
    timer = setTimeout(look, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [running, slug, orderId, documentId, onChanged]);

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
          ) : document.files.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noFiles")}</p>
          ) : (
            <ul className="space-y-2">
              {document.files.map((file) => (
                <FileRow
                  key={file.id}
                  order={order}
                  document={document}
                  file={file}
                  // The newest job on this file is the one that says how it stands.
                  job={jobs.find((job) => job.source_file_id === file.id) ?? null}
                  onTranslate={() => onTranslate(file)}
                />
              ))}
            </ul>
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
  job,
  onTranslate,
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  file: OrderFile;
  job: OrderTranslation | null;
  onTranslate: () => void;
}) {
  const t = useTranslations("Orders");
  const translating = job?.status === "processing";
  // Only what the bureau sent is translated; a translation is the answer to it.
  const translatable = file.kind === "source" && file.downloadable;
  return (
    <li className="text-sm">
      {/* On a phone the name has the line to itself and the actions sit under
          it: beside two actions it would be squeezed to nothing. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="min-w-0 basis-full truncate sm:basis-0 sm:flex-1">
          {file.name}
          <span className="text-xs text-muted-foreground">
            {" "}
            {formatSize(file.size_bytes)} · {file.uploaded_by_me ? t("mine") : t("fromBureau")}
          </span>
        </span>
        {translatable && !translating && (
          <button
            type="button"
            onClick={onTranslate}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0 cursor-pointer"
          >
            <Languages className="h-4 w-4" />
            {t("translate")}
          </button>
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
      </div>

      {translating && (
        <div className="mt-2" role="status">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("translating", { progress: job.progress ?? 0 })}
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(4, job.progress ?? 0)}%` }}
            />
          </div>
        </div>
      )}
      {job?.status === "failed" && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{t("translateFailed")}</p>
      )}
    </li>
  );
}
