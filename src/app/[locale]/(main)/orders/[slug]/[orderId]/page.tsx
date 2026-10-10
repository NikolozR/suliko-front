"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Download, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { fetchAssignedOrder, fileDownloadUrl, type OrdersLoad } from "@/features/orders/api";
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
                : t("error")}
          </p>
        </div>
      )}

      {result?.status === "ok" && <OrderDetail order={result.data} />}
    </div>
  );
}

function OrderDetail({ order }: { order: AssignedOrderDetail }) {
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
            <DocumentCard order={order} document={document} />
          </li>
        ))}
      </ul>
    </>
  );
}

function DocumentCard({
  order,
  document,
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
}) {
  const t = useTranslations("Orders");
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
                <FileRow key={file.id} order={order} document={document} file={file} />
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
}: {
  order: AssignedOrderDetail;
  document: AssignedDocumentDetail;
  file: OrderFile;
}) {
  const t = useTranslations("Orders");
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="min-w-0 flex-1 truncate">
        {file.name}
        <span className="text-xs text-muted-foreground">
          {" "}
          {formatSize(file.size_bytes)} · {file.uploaded_by_me ? t("mine") : t("fromBureau")}
        </span>
      </span>
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
