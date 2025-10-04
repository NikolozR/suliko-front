"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";

const estimatePageCount = (file: File): number => {
  const fileSizeKB = file.size / 1024;
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '')) {
    return 1;
  }

  switch (fileExtension) {
    case "pdf":
      return Math.max(1, Math.ceil(fileSizeKB / 50));
    case "docx":
      return Math.max(1, Math.ceil(fileSizeKB / 20));
    case "txt":
      return Math.max(1, Math.ceil(fileSizeKB / 3));
    case "rtf":
      return Math.max(1, Math.ceil(fileSizeKB / 10));
    case "srt":
      return Math.max(1, Math.ceil(fileSizeKB / 2));
    default:
      return Math.max(1, Math.ceil(fileSizeKB / 30));
  }
};

interface PageCountDisplayProps {
  file: File | null;
}

const PageCountDisplay = ({ file }: PageCountDisplayProps) => {
  const { 
    realPageCount, 
    isCountingPages, 
    estimatedPageCount, 
    estimatedMinutes, 
    estimatedCost, 
    updateEstimations,
  } = useDocumentTranslationStore();
  const t = useTranslations("DocumentTranslationCard");
  const PRICE_PER_PAGE = 10/12; // 10 Gel for 12 pages
  
  // Update estimations when file changes
  useEffect(() => {
    if (file) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      
      // Calculate page count based on real count or estimation
      const pageCount = (() => {
        // For PDFs and DOCX, use the real page count if available
        if ((fileExtension === 'pdf' || fileExtension === 'docx') && realPageCount !== null) {
          return realPageCount;
        }
        
        // For other file types or when real count isn't loaded yet, use estimation
        return estimatePageCount(file);
      })();
      
      const minutes = pageCount * 2;
      const cost = (Math.ceil(pageCount) * PRICE_PER_PAGE).toString(); // Pages to be used
      updateEstimations(pageCount, minutes, cost, pageCount * 483);
    }
  }, [file, realPageCount, updateEstimations]);
  
  if (!file) return null;
  
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  // Show loading state while counting pages for DOCX files
  if (isCountingPages && fileExtension === 'docx') {
    return (
      <div className="text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-suliko-default-color border-t-transparent rounded-full animate-spin"></div>
          {t("pageCount.countingPages")}
        </div>
      </div>
    );
  }
  
  // Use values from global state
  const hasRealCount = (fileExtension === 'pdf' || fileExtension === 'docx') && realPageCount !== null;

  return (
    <div className="text-sm text-muted-foreground mt-2">
      {hasRealCount ? t("pageCount.actual") : t("pageCount.estimated")}: {estimatedPageCount} {estimatedPageCount !== 1 ? t("pageCount.pages") : t("pageCount.page")}
      (~{estimatedMinutes} {estimatedMinutes !== 1 ? t("pageCount.minutes") : t("pageCount.minute")})
      <div className="mt-1 text-suliko-default-color font-semibold">
        {t("pageCount.estimatedCost", { cost: estimatedCost })}
      </div>
    </div>
  );
};

export default PageCountDisplay;