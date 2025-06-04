"use client";
import { ChangeEvent } from "react";
import FileUploadArea from "./FileUploadArea";
import FileInfoDisplay from "./FileInfoDisplay";
import DocumentPreview from "./DocumentPreview";

interface DocumentUploadViewProps {
  currentFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const DocumentUploadView: React.FC<DocumentUploadViewProps> = ({
  currentFile,
  onFileChange,
  onRemoveFile,
}) => {
  const hasFile = currentFile !== null;

  return (
    <div
      className={
        hasFile
          ? "h-[800px] max-h-[800px] flex flex-col w-full"
          : "h-[400px] max-h-[400px] flex flex-col w-full"
      }
    >
      {!hasFile ? (
        <FileUploadArea onFileChange={onFileChange} />
      ) : (
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <DocumentPreview file={currentFile} />
          </div>
          {hasFile && (
            <FileInfoDisplay
              file={currentFile}
              onFileChange={onFileChange}
              onRemoveFile={onRemoveFile}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadView;
