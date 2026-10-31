"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, ClipboardList, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MAX_DOCUMENT_UPLOAD_MB } from "@/features/translation/constants/uploadLimits";
import type { OrderSourceState } from "../orderSource";
import type { OrderSourceRef } from "../orderTranslations";

/**
 * On the document screen: says that the file in it is a bureau's, from which
 * order, and what happens to the translation. Or, when the file could not be
 * brought over, why not, with the way back.
 */
export function OrderSourceBanner({
  state,
  linked,
}: {
  state: OrderSourceState;
  /** The order of the file now on the screen, if it came from one. */
  linked: OrderSourceRef | null;
}) {
  const t = useTranslations("Orders");

  if (linked) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-suliko-default-color/30 bg-suliko-default-color/[0.04] p-4">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-medium text-foreground">
            {t("forOrder", { number: linked.orderNumber ?? "", bureau: linked.organization })}
            {linked.documentName ? ` · ${linked.documentName}` : ""}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t("forOrderHint")}{" "}
            <Link
              href={`/orders/${linked.slug}/${linked.orderId}`}
              className="text-primary hover:underline"
            >
              {t("backToOrder")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        {t("fetchingFile")}
      </div>
    );
  }

  if (state.status === "none" || state.status === "ready") return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p>
        {state.status === "signedOut"
          ? t("fileNeedsSignIn")
          : state.status === "gone"
            ? t("fileNotInOrder")
            : state.status === "tooLarge"
              ? t("fileTooLargeToTranslate", { max: MAX_DOCUMENT_UPLOAD_MB })
              : t("fileNotFetched")}{" "}
        <Link href={state.back} className="font-medium underline">
          {t("backToOrder")}
        </Link>
      </p>
    </div>
  );
}
