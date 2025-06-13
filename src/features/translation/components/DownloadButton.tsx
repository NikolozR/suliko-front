"use client";
import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { markdownToPdf, pdfToWord } from "@/features/translation/services/conversionsService";

interface DownloadButtonProps {
  content: string;
  filename?: string;
  fileType?: 'txt' | 'md' | 'docx' | 'pdf' | 'srt';
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
  const [isConverting, setIsConverting] = useState(false);

  const getMimeType = (type: string) => {
    switch (type) {
      case 'md':
        return 'text/markdown';
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'srt':
        return 'text/srt';
      default:
        return 'text/plain';
    }
  };

  const getDefaultFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    switch (fileType) {
      case 'md':
        return `translated_document_${timestamp}.md`;
      case 'pdf':
        return `translated_document_${timestamp}.pdf`;
      case 'docx':
        return `translated_document_${timestamp}.docx`;
      case 'srt':
        return `translated_subtitles_${timestamp}.srt`;
      default:
        return `translated_text_${timestamp}.txt`;
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    try {
      setIsConverting(true);
      const fileName = filename || getDefaultFilename();

      if (fileType === 'txt' || fileType === 'md' || fileType === 'srt') {
        const blob = new Blob([content], { type: getMimeType(fileType) });
        downloadBlob(blob, fileName);
      } else if (fileType === 'pdf') {
        const markdownFile = new File([content], 'content.md', { 
          type: 'text/markdown' 
        });
        const pdfBlob = await markdownToPdf(markdownFile);
        downloadBlob(pdfBlob, fileName);
      } else if (fileType === 'docx') {
        const markdownFile = new File([content], 'content.md', { 
          type: 'text/markdown' 
        });
        const pdfBlob = await markdownToPdf(markdownFile);
        const pdfFile = new File([pdfBlob], 'temp.pdf', { 
          type: 'application/pdf' 
        });
        const docxBlob = await pdfToWord(pdfFile);
        downloadBlob(docxBlob, fileName);
      }
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Failed to download file: ', err);
    } finally {
      setIsConverting(false);
    }
  };

  const isLoading = isConverting;
  const buttonText = isLoading ? 'Converting...' : downloaded ? 'Downloaded!' : label;
  const buttonIcon = downloaded ? <Check className="h-4 w-4 mr-1" /> : <Download className="h-4 w-4 mr-1" />;

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
      {buttonText}
    </Button>
  );
};

export default DownloadButton;