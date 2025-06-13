"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { cn } from "@/shared/lib/utils";

export interface DownloadFormat {
  value: string;
  label: string;
  extension: string;
  icon: React.ReactNode;
  description?: string;
}

interface FormatSelectorProps {
  formats: DownloadFormat[];
  selectedFormat: DownloadFormat;
  onFormatChange: (format: DownloadFormat) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
  headerText?: string;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  formats,
  selectedFormat,
  onFormatChange,
  size = "sm",
  variant = "outline",
  className,
  headerText = "Choose download format"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFormatSelect = (format: DownloadFormat) => {
    onFormatChange(format);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 min-w-[100px] justify-between",
          isOpen && "bg-muted"
        )}
      >
        <div className="flex items-center gap-1">
          {selectedFormat.icon}
          <span className="hidden sm:inline">{selectedFormat.extension.toUpperCase()}</span>
        </div>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-md shadow-lg z-50 py-1">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              {headerText}
            </div>
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={() => handleFormatSelect(format)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3",
                  selectedFormat.value === format.value && "bg-muted text-suliko-default-color"
                )}
              >
                <div className="flex-shrink-0">
                  {format.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{format.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {format.extension}
                    </span>
                  </div>
                </div>
                {selectedFormat.value === format.value && (
                  <div className="w-2 h-2 bg-suliko-default-color rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FormatSelector; 