import { ChangeEvent, useState, DragEvent } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/features/ui/components/ui/label";
import { Input } from "@/features/ui/components/ui/input";
import { useTranslations } from "next-intl";

interface FileUploadAreaProps {
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileClick?: () => boolean;
  id?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileChange, onFileClick, id = "file-upload" }) => {
  const t = useTranslations('DocumentTranslationCard');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

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
        className={`w-full h-full border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${
          isDragOver
            ? "border-suliko-default-color bg-suliko-default-color/10 scale-[1.02]"
            : "border-gray-300 hover:border-suliko-default-color"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="cursor-pointer">
          <Upload className={`mx-auto h-8 w-8 sm:h-12 sm:w-12 transition-all duration-200 ${
            isDragOver ? "text-suliko-default-color -translate-y-1" : "text-muted-foreground"
          }`} />
          <p className={`mt-4 text-sm transition-colors ${
            isDragOver ? "text-suliko-default-color" : "text-muted-foreground"
          }`}>
            {isDragOver ? t('dropFiles') || "Drop files here" : t('dragAndDrop')}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('supportedFormats')}
          </p>
          <Input
            type="file"
            className="hidden"
            id={id}
            accept=".pdf,.docx,.doc,.txt,.md,.markdown,.srt,.jpg,.jpeg,.png"
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