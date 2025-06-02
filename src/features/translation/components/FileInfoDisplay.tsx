"use client";
import { ChangeEvent } from "react";
import { FileText, X } from "lucide-react";
import { Label } from "@/features/ui/components/ui/label";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";

interface FileInfoDisplayProps {
  file: File;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  id?: string;
}

const FileInfoDisplay: React.FC<FileInfoDisplayProps> = ({ 
  file, 
  onFileChange, 
  onRemoveFile, 
  id = "file-upload-change" 
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-suliko-default-color" />
        <div>
          <p className="font-medium text-sm">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
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
            <span>ფაილის შეცვლა</span>
          </Button>
        </Label>
        <Input
          type="file"
          className="hidden"
          id={id}
          onChange={onFileChange}
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