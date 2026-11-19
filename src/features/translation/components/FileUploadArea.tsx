import { ChangeEvent, useState, DragEvent } from "react";
import { FileX, Upload } from "lucide-react";
import { Label } from "@/features/ui/components/ui/label";
import { Input } from "@/features/ui/components/ui/input";
import { useTranslations } from "next-intl";
import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  MAX_DOCUMENT_UPLOAD_BYTES,
  formatBytes,
  isDragLikelyUnsupported,
} from "../constants/uploadLimits";

interface FileUploadAreaProps {
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileClick?: () => boolean;
  id?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileChange, onFileClick, id = "file-upload" }) => {
  const t = useTranslations('DocumentTranslationCard');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    setIsRejected(isDragLikelyUnsupported(e.dataTransfer?.items));
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsRejected(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsRejected(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Create a synthetic event to match the expected ChangeEvent structure
      const syntheticEvent = {
        target: {
          files: files,
          value: files[0]?.name || "",
        } as HTMLInputElement,
      } as ChangeEvent<HTMLInputElement>;
      
      onFileChange(syntheticEvent);
    }
  };

  return (
    <Label htmlFor={id} className="w-full block h-full">
      <div
        className={`group relative w-full h-full rounded-xl border p-4 sm:p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[var(--ease-out-strong)] focus-within:ring-2 focus-within:ring-ring/40 ${
          isRejected
            ? "border-destructive bg-destructive/10"
            : isDragOver
              ? "border-beam border-accent-text bg-accent-text/10 shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-text)_15%,transparent)] scale-[1.01]"
              : "border-border bg-muted/40 hover:border-accent-text/60 hover:bg-accent-text/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="cursor-pointer">
          <span
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 sm:h-14 sm:w-14 ${
              isRejected
                ? "bg-destructive/15 text-destructive"
                : isDragOver
                  ? "bg-accent-text/15 text-accent-text"
                  : "bg-card text-muted-foreground ring-1 ring-border group-hover:text-accent-text"
            }`}
          >
            {isRejected ? (
              <FileX className="h-6 w-6" aria-hidden />
            ) : (
              <Upload
                className={`h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${isDragOver ? "-translate-y-0.5" : ""}`}
                aria-hidden
              />
            )}
          </span>
          <p
            aria-live="polite"
            className={`mt-4 text-sm font-medium transition-colors ${
              isRejected ? "text-destructive" : isDragOver ? "text-accent-text" : "text-foreground"
            }`}
          >
            {isRejected ? t('dropRejected') : isDragOver ? t('dropFiles') : t('dragAndDrop')}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('supportedFormats', { max: formatBytes(MAX_DOCUMENT_UPLOAD_BYTES) })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            {t('pasteFromClipboard')}
          </p>
          <Input
            type="file"
            className="hidden"
            id={id}
            accept={DOCUMENT_ACCEPT_ATTRIBUTE}
            onChange={onFileChange}
            onClick={(e) => {
              if (onFileClick && !onFileClick()) {
                e.preventDefault();
                return false;
              }
            }}
          />
        </div>
      </div>
    </Label>
  );
};

export default FileUploadArea; 