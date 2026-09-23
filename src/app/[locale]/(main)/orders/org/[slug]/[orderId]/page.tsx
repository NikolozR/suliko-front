"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/features/ui/components/ui/button";
import { Card } from "@/features/ui/components/ui/card";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  OrdersApiError,
  getAssignedOrder,
  type AssignedDocumentDetail,
  type AssignedOrderDetail,
} from "@/features/orders";
import { FileSection, type ListedFile } from "@/features/orders/components/OrderFiles";
import { DueDate } from "@/features/orders/components/OrderMeta";
import { OrderTranslationJobs } from "@/features/orders/components/OrderTranslationJobs";
import { TranslateDialog } from "@/features/orders/components/TranslateDialog";
import { ORDER_FILES_CHANGED } from "@/features/orders/store/orderTranslations";
import {
  BackToOrders,
  OrdersGate,
  OrdersNotice,
  OrdersSkeleton,
} from "@/features/orders/components/OrdersGate";
import { formatDate, pairLabel } from "@/features/orders/utils/orderFormat";

export default function AssignedOrderPage() {
  const params = useParams<{ slug: string; orderId: string }>();

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <BackToOrders />
      <OrdersGate>
        <AssignedOrderView slug={params.slug} orderId={Number(params.orderId)} />
      </OrdersGate>
    </div>
  );
}

function AssignedOrderView({ slug, orderId }: { slug: string; orderId: number }) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const [order, setOrder] = useState<AssignedOrderDetail | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useDocumentTitle(order ? t("orderNumber", { id: order.order_id }) : null);

  const load = useCallback(async () => {
    try {
      setOrder(await getAssignedOrder(slug, orderId));
      setError(null);
    } catch (loadError) {
      setError(loadError as Error);
    }
  }, [slug, orderId]);

  useEffect(() => {
    void load();
    // A Suliko translation finishing attaches a file; show it.
    const onFilesChanged = () => void load();
    window.addEventListener(ORDER_FILES_CHANGED, onFilesChanged);
    return () => window.removeEventListener(ORDER_FILES_CHANGED, onFilesChanged);
  }, [load]);

  if (error && !order) {
    const notFound = error instanceof OrdersApiError && error.status === 404;
    return (
      <OrdersNotice tone="error">
        <p>{notFound ? t("notFound") : t("loadError")}</p>
        {!notFound && (
          <Button variant="outline" size="sm" onClick={() => void load()}>
            {t("retry")}
          </Button>
        )}
      </OrdersNotice>
    );
  }
  if (!order) return <OrdersSkeleton />;

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-border/60 space-y-3">
        <p className="text-xs text-muted-foreground">{t("orderNumber", { id: order.order_id })}</p>
        <h1 className="text-2xl font-semibold text-foreground break-words">{order.client_name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {order.organization.name}
          </span>
          <DueDate value={order.due_date} className="text-sm" />
          <span className="text-sm text-muted-foreground">
            {t("orderDate")}: {formatDate(order.order_date, locale)}
          </span>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("documents")}</h2>
        {order.documents.map((document) => (
          <AssignedDocumentCard
            key={document.id}
            slug={slug}
            orderId={order.order_id}
            document={document}
            onChanged={() => void load()}
          />
        ))}
      </section>
    </div>
  );
}

function AssignedDocumentCard({
  slug,
  orderId,
  document,
  onChanged,
}: {
  slug: string;
  orderId: number;
  document: AssignedDocumentDetail;
  onChanged: () => void;
}) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const [translating, setTranslating] = useState<ListedFile | null>(null);
  const target = { type: "assigned", slug, orderId, documentId: document.id } as const;
  const mine = new Set(document.files.filter((file) => file.uploaded_by_me).map((file) => file.id));

  return (
    <Card className="p-6 border border-border/60 space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg shrink-0 bg-sky-50 dark:bg-sky-950/40">
          <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">{pairLabel(document, locale)}</h3>
          <p className="text-xs text-muted-foreground">
            {[document.document_type_name, t("pages", { count: document.page_count })]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {document.files_state === "not_linked" && (
        <OrdersNotice>
          <p>{t("filesNotLinked")}</p>
        </OrdersNotice>
      )}

      {document.files_state === "unavailable" && (
        <OrdersNotice tone="error">
          <p>{t("filesUnavailable")}</p>
          <Button variant="outline" size="sm" onClick={onChanged}>
            {t("retry")}
          </Button>
        </OrdersNotice>
      )}

      {document.files_state === "ok" && (
        <>
          <FileSection
            title={t("sourceFiles")}
            kind="source"
            target={target}
            files={document.files.filter((file) => file.kind === "source")}
            canUpload={false}
            note={t("sourceFromBureau")}
            canDelete={() => false}
            onTranslate={setTranslating}
            onChanged={onChanged}
          />
          <FileSection
            title={t("translationFiles")}
            kind="translation"
            target={target}
            files={document.files.filter((file) => file.kind === "translation")}
            canUpload
            uploadLabel={t("uploadTranslation")}
            canDelete={(file) => mine.has(String(file.id))}
            onChanged={onChanged}
          >
            <OrderTranslationJobs target={target} />
          </FileSection>
          <TranslateDialog
            open={translating !== null}
            onOpenChange={(open) => !open && setTranslating(null)}
            target={target}
            file={translating}
            targetLanguages={[document.target_language]}
          />
        </>
      )}
    </Card>
  );
}
