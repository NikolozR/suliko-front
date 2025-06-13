"use client";
import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";

interface DownloadButtonProps {
  content: string;
  filename?: string;
  fileType?: 'txt' | 'md' | 'docx';
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  label?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  filename,
  fileType = 'txt',
  className = "",
  size = "sm",
  variant = "outline",
  label = "Download"
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const getMimeType = (type: string) => {
    switch (type) {
      case 'md':
        return 'text/markdown';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'text/plain';
    }
  };

  const getDefaultFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    switch (fileType) {
      case 'md':
        return `translated_document_${timestamp}.md`;
      case 'docx':
        return `translated_document_${timestamp}.docx`;
      default:
        return `translated_text_${timestamp}.txt`;
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: getMimeType(fileType) });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || getDefaultFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Failed to download file: ', err);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={`transition-all duration-200 ${className}`}
      disabled={!content.trim()}
    >
      {downloaded ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Downloaded!
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-1" />
          {label}
        </>
      )}
    </Button>
  );
};

export default DownloadButton; 