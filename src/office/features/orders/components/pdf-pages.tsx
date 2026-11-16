"use client";
// Owned by suliko-front: the renderer is shared (src/shared/components/pdf/PdfPages.tsx).

import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { PdfPages as SharedPdfPages } from "@/shared/components/pdf/PdfPages";

/** The original beside a translation, with Office's loading text. */
export function PdfPages(props: Omit<ComponentProps<typeof SharedPdfPages>, "loadingLabel">) {
  const t = useTranslations("files.workspace");
  return <SharedPdfPages {...props} loadingLabel={t("loadingOriginal")} />;
}
