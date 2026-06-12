"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";

interface NameReviewModalProps {
  open: boolean;
  items: NameTranslationItem[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (editedItems: NameTranslationItem[]) => void;
  onSkip: () => void;
}

const NameReviewModal: React.FC<NameReviewModalProps> = ({
  open,
  items,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
  onSkip,
}) => {
  const t = useTranslations("NameReviewModal");
  const [rows, setRows] = useState<NameTranslationItem[]>(items);

  // Re-seed local editable state each time the modal is opened with a fresh set of detections.
  useEffect(() => {
    if (open) {
      setRows(items);
    }
  }, [open, items]);

  const updateTranslation = (index: number, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, translation: value } : row)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const confirmed = rows.filter((row) => row.original.trim() && row.translation.trim());
    onConfirm(confirmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("emptyState")}</p>
        ) : (
          <div className="mt-2 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {rows.map((row, index) => {
              const isOrg = row.type === "Organization";
              return (
                <div
                  key={`${row.original}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2 sm:gap-3 sm:p-3"
                >
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    title={isOrg ? t("organization") : t("person")}
                  >
                    {isOrg ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="hidden sm:inline">{isOrg ? t("organization") : t("person")}</span>
                  </span>

                  <span
                    className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
                    title={row.original}
                  >
                    {row.original}
                  </span>

                  <span className="shrink-0 text-muted-foreground">→</span>

                  <Input
                    value={row.translation}
                    onChange={(e) => updateTranslation(index, e.target.value)}
                    placeholder={t("translationPlaceholder")}
                    className="h-8 min-w-0 flex-1"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(index)}
                    aria-label={t("remove")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="mt-4 flex !justify-between gap-2 sm:!justify-between">
          <Button type="button" variant="outline" onClick={onSkip} disabled={isSubmitting}>
            {t("skip")}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? t("translating") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameReviewModal;
