"use client";
import { ChangeEvent } from "react";
import DocumentPreview from "./DocumentPreview";
import MarkdownPreview from "./MarkdownPreview";
import FileInfoDisplay from "./FileInfoDisplay";

interface TranslationResultViewProps {
  currentFile: File;
  translatedMarkdown: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const TranslationResultView: React.FC<TranslationResultViewProps> = ({
  currentFile,
  translatedMarkdown,
  onFileChange,
  onRemoveFile
}) => {
  return (
    <div className="flex gap-8">
      <div className="w-full md:flex-1 min-w-0">
        <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
          ორიგინალი დოკუმენტი
        </div>
        <div className="h-[800px] max-h-[800px] flex flex-col w-full">
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <DocumentPreview file={currentFile} />
            </div>
            <FileInfoDisplay
              file={currentFile}
              onFileChange={onFileChange}
              onRemoveFile={onRemoveFile}
              id="file-upload-change-split"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:flex-1 min-w-0">
        <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
          თარგმნილი ტექსტი
        </div>
        <div className="h-[800px] max-h-[800px]">
          <MarkdownPreview 
            content={translatedMarkdown} 
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TranslationResultView; 