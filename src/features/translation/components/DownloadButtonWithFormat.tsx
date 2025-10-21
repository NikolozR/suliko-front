"use client";
import { useState } from "react";
import { Download, Check, FileText, File } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import FormatSelector, { DownloadFormat } from "./FormatSelector";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";

interface DownloadButtonWithFormatProps {
  content: string;
  filename?: string;
  originalFileName?: string; // Original uploaded file name
  availableFormats?: DownloadFormat[];
  onDownload?: (format: DownloadFormat, content: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  label?: string;
  disabled?: boolean;
}

const defaultFormats: DownloadFormat[] = [
  {
    value: "txt",
    label: "Text File",
    extension: "txt",
    icon: <FileText className="w-4 h-4" />,
    description: "Plain text format"
  },
  {
    value: "pdf",
    label: "PDF Document",
    extension: "pdf",
    icon: <FileText className="w-4 h-4" />,
    description: "Portable Document Format"
  },
  {
    value: "docx",
    label: "Word Document",
    extension: "docx",
    icon: <File className="w-4 h-4" />,
    description: "Microsoft Word format"
  }
];

const DownloadButtonWithFormat: React.FC<DownloadButtonWithFormatProps> = ({
  content,
  filename,
  originalFileName,
  availableFormats = defaultFormats,
  onDownload,
  className = "",
  size = "sm",
  variant = "outline",
  disabled = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>(availableFormats[0]);
  const [downloaded, setDownloaded] = useState(false);
  const translatedSuffix = useTranslatedSuffix();

  const getMimeType = (format: DownloadFormat) => {
    switch (format.value) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'text/plain';
    }
  };

  const getDefaultFilename = (format: DownloadFormat) => {
    if (originalFileName) {
      return generateLocalizedFilename(originalFileName, format.extension, translatedSuffix);
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    return `document_${translatedSuffix}_${timestamp}.${format.extension}`;
  };

  const handleDownload = () => {
    if (disabled || !content.trim()) return;

    try {
      if (onDownload) {
        onDownload(selectedFormat, content);
      } else {
        if (selectedFormat.value === 'txt') {
          const blob = new Blob([content], { type: getMimeType(selectedFormat) });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || getDefaultFilename(selectedFormat);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
        }
      }
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Failed to download file: ', err);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <FormatSelector
        formats={availableFormats}
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
        size={size}
        variant={variant}
      />
      
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleDownload}
        className="transition-all duration-200"
        disabled={disabled || !content.trim()}
      >
        {downloaded ? (
          <>
            <Check className="h-4 w-4 mr-1" />
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1" />
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadButtonWithFormat; 