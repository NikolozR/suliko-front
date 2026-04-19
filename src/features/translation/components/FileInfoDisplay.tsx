"use client";
import { ChangeEvent } from "react";
import { FileText, FileImage, File, X } from "lucide-react";
import { Label } from "@/features/ui/components/ui/label";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { useTranslations } from "next-intl";

interface FileInfoDisplayProps {
  file: File;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileClick?: () => boolean;
  onRemoveFile: () => void;
  id?: string;
}

const fileIconConfig: Record<string, { icon: React.ElementType; className: string }> = {
  pdf: { icon: File, className: "text-red-500 dark:text-red-400" },
  docx: { icon: FileText, className: "text-blue-500 dark:text-blue-400" },
  doc: { icon: FileText, className: "text-blue-500 dark:text-blue-400" },
  txt: { icon: FileText, className: "text-muted-foreground" },
  md: { icon: FileText, className: "text-muted-foreground" },
  markdown: { icon: FileText, className: "text-muted-foreground" },
  srt: { icon: FileText, className: "text-purple-500 dark:text-purple-400" },
  jpg: { icon: FileImage, className: "text-green-500 dark:text-green-400" },
  jpeg: { icon: FileImage, className: "text-green-500 dark:text-green-400" },
  png: { icon: FileImage, className: "text-green-500 dark:text-green-400" },
};

const FileInfoDisplay: React.FC<FileInfoDisplayProps> = ({
  file,
  onFileChange,
  onFileClick,
  onRemoveFile,
  id = "file-upload-change"
}) => {
  const t = useTranslations("DocumentTranslationCard");
  const ext = file?.name.split(".").pop()?.toLowerCase() || "";
  const { icon: IconComponent, className: iconClass } = fileIconConfig[ext] ?? { icon: FileText, className: "text-suliko-default-color" };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border/60">
          <IconComponent className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate max-w-[160px] sm:max-w-[240px]">{file?.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB · {ext.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            asChild
          >
            <span>{t("pageCount.changeFile")}</span>
          </Button>
        </Label>
        <Input
          type="file"
          className="hidden"
          id={id}
          accept="*/*"
          onChange={onFileChange}
          onClick={(e) => {
            if (onFileClick && !onFileClick()) {
              e.preventDefault();
              return false;
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemoveFile}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileInfoDisplay; 