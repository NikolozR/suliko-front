"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { saveAs } from "file-saver";
import { wordBlob } from "@/features/translation/utils/wordPage";
import { generatePdfFromHtml } from "@/features/translation/utils/html2pdf-client";
import { useComboText } from "@/shared/components/Kbd";
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
  label,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const translatedSuffix = useTranslatedSuffix();
  const shortcutText = useComboText(["Alt", "Shift", "D"]);

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
        await generatePdfFromHtml(content, fileName);
      } else if (fileType === "docx") {
        saveAs(await wordBlob(content), fileName);
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
    <Check className={`h-4 w-4 ${label ? "sm:mr-1.5" : "mr-1"}`} />
  ) : (
    <Download className={`h-4 w-4 ${label ? "sm:mr-1.5" : "mr-1"}`} />
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      data-shortcut="download"
      title={label ? `${label} (${shortcutText})` : shortcutText}
      className={`transition-all duration-200 ${className}`}
      disabled={!content.trim() || isLoading}
      aria-label={label}
    >
      {buttonIcon}
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
};

export default DownloadButton;
