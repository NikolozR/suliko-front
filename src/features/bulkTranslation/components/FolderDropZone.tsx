"use client";

import { useRef, useState } from "react";
import { FolderUp, Loader2 } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  FolderScanResult,
  scanDataTransfer,
  scanFileList,
} from "../utils/folderScanning";

interface FolderDropZoneProps {
  onFilesSelected: (result: FolderScanResult) => void;
  disabled?: boolean;
}

/**
 * Accepts a whole folder, by drag-drop or by picking one.
 *
 * Both routes are offered because they behave differently: the picker is reliable
 * everywhere but shows an OS dialog, while drag-drop is faster and is what people reach
 * for first when they already have the folder open.
 */
export function FolderDropZone({ onFilesSelected, disabled }: FolderDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag events fire for every child element, so a plain boolean flickers as the pointer
  // moves across the zone's contents. Counting enter/leave pairs tracks it correctly.
  const dragDepth = useRef(0);

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    if (disabled) return;

    setScanning(true);
    try {
      const result = await scanDataTransfer(event.dataTransfer);
      onFilesSelected(result);
    } finally {
      setScanning(false);
    }
  };

  const handlePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;

    onFilesSelected(scanFileList(files));
    // Reset so picking the same folder twice in a row still fires a change event.
    event.target.value = "";
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setIsDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        "rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        isDragging
          ? "border-suliko-default-color bg-suliko-default-color/5"
          : "border-border/70 bg-muted/20",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-background p-3 shadow-sm">
          {scanning ? (
            <Loader2 className="h-6 w-6 animate-spin text-suliko-default-color" />
          ) : (
            <FolderUp className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">
            {scanning ? "Reading folder…" : "Drop a folder here"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, text and image files are picked up. Subfolders are kept.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || scanning}
          onClick={() => inputRef.current?.click()}
        >
          Choose folder
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        // Non-standard but supported everywhere that matters; React needs them lowercase.
        {...{ webkitdirectory: "", directory: "" }}
        className="hidden"
        onChange={handlePicked}
      />
    </div>
  );
}
