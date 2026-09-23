"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import { Card } from "@/features/ui/components/ui/card";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  OrdersApiError,
  deletePersonalOrder,
  getPersonalOrder,
  updatePersonalOrder,
  type PersonalOrderDetail,
} from "@/features/orders";
import { FileSection, type ListedFile } from "@/features/orders/components/OrderFiles";
import { DueDate, LanguagePairBadges } from "@/features/orders/components/OrderMeta";
import { OrderTranslationJobs } from "@/features/orders/components/OrderTranslationJobs";
import { TranslateDialog } from "@/features/orders/components/TranslateDialog";
import { ORDER_FILES_CHANGED } from "@/features/orders/store/orderTranslations";
import {
  BackToOrders,
  OrdersGate,
  OrdersNotice,
  OrdersSkeleton,
} from "@/features/orders/components/OrdersGate";
import { PersonalOrderForm } from "@/features/orders/components/PersonalOrderForm";
import { formatDate } from "@/features/orders/utils/orderFormat";

export default function PersonalOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <BackToOrders />
      <OrdersGate>
        <PersonalOrderView orderId={orderId} />
      </OrdersGate>
    </div>
  );
}

function PersonalOrderView({ orderId }: { orderId: number }) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const router = useRouter();
  const [order, setOrder] = useState<PersonalOrderDetail | null>(null);
  const [error, setError] = useState<OrdersApiError | Error | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [translating, setTranslating] = useState<ListedFile | null>(null);

  useDocumentTitle(order ? `${order.client_name} — ${t("personalOrderNumber", { id: order.id })}` : null);

  const load = useCallback(async () => {
    try {
      setOrder(await getPersonalOrder(orderId));
      setError(null);
    } catch (loadError) {
      setError(loadError as Error);
    }
  }, [orderId]);

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

  const target = { type: "personal", orderId: order.id } as const;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePersonalOrder(order.id);
      toast.success(t("deleted"));
      router.push("/orders");
    } catch (deleteError) {
      toast.error(t("deleteFailed", { message: (deleteError as Error).message }));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-border/60 space-y-4">
        {editing ? (
          <PersonalOrderForm
            initial={{
              client_name: order.client_name,
              due_date: order.due_date,
              notes: order.notes,
              language_pairs: order.language_pairs,
            }}
            submitLabel={t("save")}
            submittingLabel={t("saving")}
            onCancel={() => setEditing(false)}
            onSubmit={async (input) => {
              setOrder(await updatePersonalOrder(order.id, input));
              setEditing(false);
              toast.success(t("saved"));
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("personalOrderNumber", { id: order.id })}
                </p>
                <h1 className="text-2xl font-semibold text-foreground break-words">
                  {order.client_name}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("createdOn", { date: formatDate(order.created_at, locale) ?? "" })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil />
                  {t("edit")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="text-red-600 dark:text-red-400" />
                  {t("deleteOrder")}
                </Button>
              </div>
            </div>
            <DueDate value={order.due_date} className="text-sm" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("languagePairs")}</p>
              <LanguagePairBadges pairs={order.language_pairs} />
            </div>
            {order.notes && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("notes")}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {order.notes}
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="p-6 border border-border/60 space-y-6">
        <h2 className="text-lg font-semibold">{t("files")}</h2>
        <FileSection
          title={t("sourceFiles")}
          kind="source"
          target={target}
          files={order.files.filter((file) => file.kind === "source")}
          canUpload
          uploadLabel={t("uploadSource")}
          canDelete={() => true}
          onTranslate={setTranslating}
          onChanged={() => void load()}
        />
        <FileSection
          title={t("translationFiles")}
          kind="translation"
          target={target}
          files={order.files.filter((file) => file.kind === "translation")}
          canUpload
          uploadLabel={t("uploadTranslation")}
          canDelete={() => true}
          onChanged={() => void load()}
        >
          <OrderTranslationJobs target={target} />
        </FileSection>
      </Card>

      <TranslateDialog
        open={translating !== null}
        onOpenChange={(open) => !open && setTranslating(null)}
        target={target}
        file={translating}
        targetLanguages={order.language_pairs.map((pair) => pair.target_language)}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteOrderTitle")}
        description={t("deleteOrderDescription")}
        confirmLabel={t("deleteOrder")}
        onConfirm={() => void handleDelete()}
        loading={deleting}
      />
    </div>
  );
}
