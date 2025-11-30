"use client";
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { Card, CardContent } from "@/features/ui/components/ui/card";
import { useTranslations } from "next-intl";
import { FileText, Check } from "lucide-react";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";

interface PageRangeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
}

interface PageRangeOption {
  label: string;
  startPage: number;
  endPage: number;
}

export const PageRangeSelector: React.FC<PageRangeSelectorProps> = ({
  isOpen,
  onClose,
  totalPages,
}) => {
  const t = useTranslations("DocumentTranslationCard.pageSelection");
  const { selectedPageRange, setSelectedPageRange } = useDocumentTranslationStore();
  const [selectedOption, setSelectedOption] = useState<{ startPage: number; endPage: number } | null>(
    selectedPageRange
  );

  // Generate page range options
  const pageRangeOptions: PageRangeOption[] = useMemo(() => {
    if (totalPages <= 4) return [];
    
    const options: PageRangeOption[] = [];
    
    // First 3 pages
    options.push({
      label: t("options.first3"),
      startPage: 1,
      endPage: 3,
    });
    
    // Sliding window options (pages 2-4, 3-5, etc.)
    for (let start = 2; start <= totalPages - 2; start++) {
      const end = start + 2;
      if (end <= totalPages) {
        options.push({
          label: t("options.middle", { start, end }),
          startPage: start,
          endPage: end,
        });
      }
    }
    
    // Last 3 pages
    if (totalPages >= 3) {
      options.push({
        label: t("options.last3"),
        startPage: totalPages - 2,
        endPage: totalPages,
      });
    }
    
    return options;
  }, [totalPages, t]);

  const handleSelect = (option: PageRangeOption) => {
    setSelectedOption({ startPage: option.startPage, endPage: option.endPage });
  };

  const handleConfirm = () => {
    if (selectedOption) {
      setSelectedPageRange(selectedOption);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedOption(selectedPageRange);
    onClose();
  };

  if (totalPages <= 4) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t("description", { totalPages, pagesLimit: 3 })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pageRangeOptions.map((option, index) => {
              const isSelected =
                selectedOption?.startPage === option.startPage &&
                selectedOption?.endPage === option.endPage;
              
              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    isSelected
                      ? "border-2 border-primary bg-primary/5"
                      : "border hover:border-primary/50"
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-base mb-1 ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}>
                          {option.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t("pages", {
                            start: option.startPage,
                            end: option.endPage,
                          })}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-3 flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isInRange = pageNum >= option.startPage && pageNum <= option.endPage;
                        return (
                          <div
                            key={pageNum}
                            className={`h-8 w-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                              isInRange
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground opacity-50"
                            }`}
                          >
                            {pageNum}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex !justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className="min-w-[100px]"
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

