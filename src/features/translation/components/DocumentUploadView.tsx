"use client";
import { ChangeEvent, useEffect } from "react";
import dynamic from "next/dynamic";
import FileUploadArea from "./FileUploadArea";
import FileInfoDisplay from "./FileInfoDisplay";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

const DocumentPreview = dynamic(() => import("./DocumentPreview"), {
  ssr: false,
  loading: () => (
    <div className="h-full p-4">
      <Skeleton className="h-6 w-48 mb-3" />
      <Skeleton className="h-[260px] w-full rounded-lg" />
    </div>
  ),
});

interface DocumentUploadViewProps {
  currentFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileClick?: () => boolean;
  onRemoveFile: () => void;
}

const DocumentUploadView: React.FC<DocumentUploadViewProps> = ({
  currentFile,
  onFileChange,
  onFileClick,
  onRemoveFile,
}) => {
  const hasFile = currentFile !== null;

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const ext = item.type === "image/png" ? "png" : "jpg";
          const file = new File([blob], `pasted-image.${ext}`, { type: item.type });
          const dt = new DataTransfer();
          dt.items.add(file);
          const syntheticEvent = {
            target: { files: dt.files, value: file.name } as HTMLInputElement,
          } as ChangeEvent<HTMLInputElement>;
          onFileChange(syntheticEvent);
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onFileChange]);

  return (
    <div
      className={
        hasFile
          ? "h-[800px] max-h-[800px] flex flex-col w-full"
          : "h-[400px] max-h-[400px] flex flex-col w-full"
      }
    >
      {!hasFile ? (
        <FileUploadArea onFileChange={onFileChange} onFileClick={onFileClick} />
      ) : (
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <DocumentPreview file={currentFile} />
          </div>
          {hasFile && (
            <FileInfoDisplay
              file={currentFile}
              onFileChange={onFileChange}
              onFileClick={onFileClick}
              onRemoveFile={onRemoveFile}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadView;
