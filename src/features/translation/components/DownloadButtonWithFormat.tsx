"use client";
import { useState } from "react";
import { Download, Check, FileText, File } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import FormatSelector, { DownloadFormat } from "./FormatSelector";

interface DownloadButtonWithFormatProps {
  content: string;
  filename?: string;
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
  availableFormats = defaultFormats,
  onDownload,
  className = "",
  size = "sm",
  variant = "outline",
  label = "Download",
  disabled = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>(availableFormats[0]);
  const [downloaded, setDownloaded] = useState(false);

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
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    return `translated_document_${timestamp}.${format.extension}`;
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
          console.log(`Download requested for format: ${selectedFormat.value}`);
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
            <span className="hidden sm:inline">Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{label}</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadButtonWithFormat; 