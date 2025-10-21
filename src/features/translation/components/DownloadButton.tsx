"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { saveAs } from "file-saver";
// @ts-expect-error Type errors, nothing special
import htmlDocx from "html-docx-js/dist/html-docx";
import { wordToPdf } from "@/features/translation/services/conversionsService";
import { useTranslations } from "next-intl";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";


interface DownloadButtonProps {
  content: string; // HTML string
  filename?: string;
  originalFileName?: string; // Original uploaded file name
  fileType?: "txt" | "md" | "docx" | "pdf" | "srt";
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  label?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  filename,
  originalFileName,
  fileType = "txt",
  className = "",
  size = "sm",
  variant = "outline",
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const t = useTranslations("Download");
  const translatedSuffix = useTranslatedSuffix();

  const getMimeType = (type: string) => {
    switch (type) {
      case "md":
        return "text/markdown";
      case "pdf":
        return "application/pdf";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "srt":
        return "text/srt";
      default:
        return "text/plain";
    }
  };

  const getDefaultFilename = () => {
    if (originalFileName) {
      return generateLocalizedFilename(originalFileName, fileType, translatedSuffix);
    }
    
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    switch (fileType) {
      case "md":
        return `document_${translatedSuffix}_${timestamp}.md`;
      case "pdf":
        return `document_${translatedSuffix}_${timestamp}.pdf`;
      case "docx":
        return `document_${translatedSuffix}_${timestamp}.docx`;
      case "srt":
        return `subtitles_${translatedSuffix}_${timestamp}.srt`;
      default:
        return `text_${translatedSuffix}_${timestamp}.txt`;
    }
  };

  const handleDownload = async () => {
    try {
      setIsConverting(true);
      const fileName = filename || getDefaultFilename();

      if (["txt", "md", "srt"].includes(fileType)) {
        const text = content.replace(/<[^>]+>/g, "");
        const blob = new Blob([text], { type: getMimeType(fileType) });
        saveAs(blob, fileName);
      } else if (fileType === "pdf") {
        // Convert HTML to docx blob
        const fullHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${content}</body></html>`;
        const docxBlob = htmlDocx.asBlob(fullHtml);
        // Convert blob to File
        const docxFile = new File([docxBlob], "temp.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        // Use backend to convert docx to pdf
        const pdfBlob = await wordToPdf(docxFile);
        saveAs(pdfBlob, fileName);
      } else if (fileType === "docx") {
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${content}</body></html>`;
        const blob = htmlDocx.asBlob(fullHtml);
        saveAs(blob, fileName);
      }

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Failed to download file: ", err);
    } finally {
      setIsConverting(false);
    }
  };

  const isLoading = isConverting;
  
  const buttonIcon = downloaded ? (
    <Check className="h-4 w-4 mr-1" />
  ) : (
    <Download className="h-4 w-4 mr-1" />
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={`transition-all duration-200 ${className}`}
      disabled={!content.trim() || isLoading}
    >
      {buttonIcon}
    </Button>
  );
};

export default DownloadButton;
