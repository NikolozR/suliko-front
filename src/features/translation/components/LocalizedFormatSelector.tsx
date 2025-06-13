"use client";
import { useTranslations } from "next-intl";
import { FileText, File } from "lucide-react";
import FormatSelector, { DownloadFormat } from "./FormatSelector";

interface LocalizedFormatSelectorProps {
  selectedFormat: DownloadFormat;
  onFormatChange: (format: DownloadFormat) => void;
  contentType?: 'text' | 'document';
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

const LocalizedFormatSelector: React.FC<LocalizedFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  contentType = 'document',
  size = "sm",
  variant = "outline",
  className
}) => {
  const t = useTranslations('DownloadFormats');

  // Generate formats based on content type with translations
  const getFormats = (): DownloadFormat[] => {
    const baseFormats: DownloadFormat[] = [
      {
        value: "txt",
        label: t('textFile'),
        extension: "txt",
        icon: <FileText className="w-4 h-4" />,
      }
    ];

    if (contentType === 'document') {
      baseFormats.push(
        {
          value: "pdf",
          label: t('pdfDocument'),
          extension: "pdf",
          icon: <FileText className="w-4 h-4" />,
        },
        {
          value: "docx",
          label: t('wordDocument'),
          extension: "docx",
          icon: <File className="w-4 h-4" />,
        }
      );
    }

    return baseFormats;
  };

  return (
    <FormatSelector
      formats={getFormats()}
      selectedFormat={selectedFormat}
      onFormatChange={onFormatChange}
      size={size}
      variant={variant}
      className={className}
      headerText={t('chooseFormat')}
    />
  );
};

export default LocalizedFormatSelector; 